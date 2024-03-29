//express is the framework we're going to use to handle requests
const express = require('express')

//Access the connection to Heroku Database
const pool = require('../utilities/exports').pool

const router = express.Router()

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */ 

/**
 * @api {post} /chats Request to add a chat
 * @apiName PostChats
 * @apiGroup Chats
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam {String} name the name for the chat
 * 
 * @apiSuccess (Success 201) {boolean} success true when the name is inserted
 * @apiSuccess (Success 201) {Number} chatId the generated chatId
 * 
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 201 OK
 *   {
 *      "success": true,
 *     "chatID": 1
 *  }
 * 
 * @apiError (400: Unknown user) {String} message "unknown email address"
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiError (400: Unknown Chat ID) {String} message "invalid chat id"
 * 
 * @apiUse JSONError
 */ 
router.post("/", (request, response, next) => {
    if (!isStringProvided(request.body.name)) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else {
        next()
    }
}, (request, response, next) => {

    let insert = `INSERT INTO Chats(Name, creatorID)
                  VALUES ($1, $2)
                  RETURNING ChatId`
    let values = [request.body.name, request.decoded.memberid]
    pool.query(insert, values)
        .then(result => {
            request.chatid = result.rows[0].chatid
            next()
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            })

        })
}, (request, response) => {
    //Insert the memberId into the chat
    let insert = `INSERT INTO ChatMembers(ChatId, MemberId, Role)
                  VALUES ($1, $2, $3)
                  RETURNING *`
    let values = [request.chatid, request.decoded.memberid, 2]
    pool.query(insert, values)
        .then(result => {
            response.send({
                success: true,
                chatID:request.chatid
            })
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error 4",
                error: err
            })
        })
    })

/**
 * @api {post} /chats Request to delete a chat
 * @apiName DeleteChats
 * @apiGroup Chats
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam {String} chatid the chatid for the chat
 * 
 * @apiSuccess (Success 201) {boolean} success true when chat found and deleted, members removed
 * @apiSuccess (Success 201) {Number} chatId for the deleted chat
 * 
 * @apiSuccessExample {json} Success-Response: 
 *   HTTP/1.1 201 OK
 *  {
 *     "success": true,
 *     "chatID": 1,
 *    "message": "Chat deleted, members removed"
 * }
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiError (400: Unknown Chat ID) {String} message "invalid chat id"
 * 
 * @apiUse JSONError
 */ 
 router.delete("/", (request, response, next) => {
    chatid = request.headers.chatid
    request.chatid = chatid
    if (isNaN(chatid)) {
       response.status(400).send({
           message: "Missing required information"
       })
    } else {
        next()
    }
}, (request, response, next) => {
    //Find chat
    let query = 'SELECT * FROM CHATS WHERE chatid = $1 AND creatorid = $2'
    let values = [request.chatid, request.decoded.memberid]
    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    chatid: request.chatid,
                    memberid: request.decoded.memberid,
                    message: "Chat not found or not owned by user"
                })
                return
            } else {
                next()
            }
            
           
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error 4",
                error: err
            })
        })
    },(request, response, next) => {
        //Delete chat members
        let query = 'DELETE FROM MESSAGES WHERE chatid = $1'
        let values = [request.chatid]
        pool.query(query, values)
            .then(result => {
                next()
               
            }).catch(err => {
                response.status(400).send({
                    message: "SQL Error 3.5",
                    error: err
                })
            })
        }, (request, response, next) => {
    //Delete chat members
    let query = 'DELETE FROM CHATMEMBERS WHERE chatid = $1'
    let values = [request.chatid]
    pool.query(query, values)
        .then(result => {
            next()
           
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error 4",
                error: err
            })
        })
    }, (request, response) => {

    let query = 'DELETE FROM CHATS WHERE chatid = $1 AND creatorid = $2'
    let values = [request.chatid, request.decoded.memberid]
    pool.query(query, values)
        .then(result => {
            response.status(200).send({
                success: true,
                deleted_chatID:request.chatid,
                message: "Chat deleted, members removed"
            })
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            })

        })
})

/**
 * @api {put} /chats/:chatId? Request add a user to a chat
 * @apiName PutChats
 * @apiGroup Chats
 * 
 * @apiDescription Adds the user associated with the required JWT. 
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiParam {Number} chatId the chat to add the user to
 * @apiParam {String} email the email of the user to add
 * 
 * @apiSuccess {boolean} success true when the name is inserted
 * 
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *   {
 *    "success": true
 *   }
 * 
 * @apiError (404: Chat Not Found) {String} message "chatID not found"
 * @apiError (404: Email Not Found) {String} message "email not found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number" 
 * @apiError (400: Duplicate Email) {String} message "user already joined"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 
router.put("/:chatId/:email", (request, response, next) => {
    //validate on empty parameters
    if (!request.params.email) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.params.chatId)) {
        response.status(400).send({
            message: "Malformed parameter. chatId must be a number"
        })
    } else {
        request.creatorID = request.decoded.memberid
        console.log(request.creatorID)
        next()
    }
}, (request, response, next) => {
    //validate chat id exists
    let query = 'SELECT * FROM CHATS WHERE ChatId=$1'
    let values = [request.params.chatId]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Chat ID not found"
                })
            } else {
                if (result.rows[0].creatorid !== request.creatorID) {
                    console.log(result.rows[0].creatorid + ", " + request.creatorID)
                    response.status(400).send({
                        message: "User doesn't have permission to add member to chat"
                    })
                    return
                }
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error 1",
                error: error
            })
        })
        //code here based on the results of the query
}, (request, response, next) => {
    //validate email exists 
    let query = 'SELECT * FROM Members WHERE email=$1'
    let values = [request.params.email]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "email not found"
                })
            } else {
                request.memberid = result.rows[0].memberid
                //user found
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error 2",
                error: error
            })
        })
}, (request, response, next) => {
        //validate email does not already exist in the chat
        let query = 'SELECT * FROM ChatMembers WHERE ChatId=$1 AND MemberId=$2'
        let values = [request.params.chatId, request.memberid]
    
        pool.query(query, values)
            .then(result => {
                if (result.rowCount > 0) {
                    response.status(400).send({
                        message: "user already joined"
                    })
                } else {
                    next()
                }
            }).catch(error => {
                response.status(400).send({
                    message: "SQL Error 3",
                    error: error
                })
            })

}, (request, response) => {
    //Insert the memberId into the chat
    let insert = `INSERT INTO ChatMembers(ChatId, MemberId)
                  VALUES ($1, $2)
                  RETURNING *`
    let values = [request.params.chatId, request.memberid]
    pool.query(insert, values)
        .then(result => {
            response.send({
                success: true
            })
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error 4",
                error: err
            })
        })
    }
)

/**
 * @api {get} /chats/:chatId? Request to get the emails of user in a chat
 * @apiName GetChats
 * @apiGroup Chats
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiParam {Number} chatId the chat to look up. 
 * 
 * @apiSuccess {Number} rowCount the number of messages returned
 * @apiSuccess {Object[]} members List of members in the chat
 * 
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *  {
 *   "rowCount": 2,
 *    "members": []
 * }
 * 
 * @apiError (404: ChatId Not Found) {String} message "Chat ID Not Found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number" 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 
router.get("/:chatId", (request, response, next) => {
    //validate on missing or invalid (type) parameters
    if (!request.params.chatId) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.params.chatId)) {
        response.status(400).send({
            message: "Malformed parameter. chatId must be a number"
        })
    } else {
        next()
    }
},  (request, response, next) => {
    //validate chat id exists
    let query = 'SELECT * FROM CHATS WHERE ChatId=$1'
    let values = [request.params.chatId]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Chat ID not found"
                })
            } else {
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
    }, (request, response) => {
        //Retrieve the members
        let query = `SELECT Members.Email 
                    FROM ChatMembers
                    INNER JOIN Members ON ChatMembers.MemberId=Members.MemberId
                    WHERE ChatId=$1`
        let values = [request.params.chatId]
        pool.query(query, values)
            .then(result => {
                response.send({
                    rowCount : result.rowCount,
                    rows: result.rows
                })
            }).catch(err => {
                response.status(400).send({
                    message: "SQL Error",
                    error: err
                })
            })
});

/**
 * @api {delete} /chats/:chatId?/:email? Request delete a user from a chat
 * @apiName DeleteChats
 * @apiGroup Chats
 * 
 * @apiDescription Does not delete the user associated with the required JWT but 
 * instead deletes the user based on the email parameter.  
 * 
 * @apiParam {Number} chatId the chat to delete the user from
 * @apiParam {String} email the email of the user to delete
 * 
 * @apiSuccess {boolean} success true when the name is deleted
 * 
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 * {
 *  "success": true
 * }
 * 
 * @apiError (404: Chat Not Found) {String} message "chatID not found"
 * @apiError (404: Email Not Found) {String} message "email not found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number" 
 * @apiError (400: Duplicate Email) {String} message "user not in chat"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 
router.delete("/:chatId/:email", (request, response, next) => {
    //validate on empty parameters
    if (!request.params.chatId || !request.params.email) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.params.chatId)) {
        response.status(400).send({
            message: "Malformed parameter. chatId must be a number"
        })
    } else {
        next()
    }
}, (request, response, next) => {
    //validate chat id exists
    let query = 'SELECT * FROM CHATS WHERE ChatId=$1'
    let values = [request.params.chatId]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Chat ID not found"
                })
            } else {
                request.creatorid = result.rows[0].creatorid
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error 1",
                error: error
            })
        })
}, (request, response, next) => {
    //validate email exists AND convert it to the associated memberId
    let query = 'SELECT MemberID FROM Members WHERE Email=$1'
    let values = [request.params.email]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "email not found"
                })
            } else {
                request.chatmemberid = result.rows[0].memberid
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error 2",
                error: error
            })
        })
}, (request, response, next) => {

        //validate email exists in the chat
        let query = 'SELECT * FROM ChatMembers WHERE ChatId=$1 AND MemberId=$2'
        let values = [request.params.chatId, request.chatmemberid]
    
        pool.query(query, values)
            .then(result => {
                if (result.rowCount > 0) {
                    if (((request.decoded.memberid === request.creatorid)) || (request.chatmemberid === request.decoded.memberid)) {
                        next()
                    } else {
                        response.status(400).send({
                            message: "User doesn't have permission to remove member from chat"
                        })
                    }
                    
                } else {
                    response.status(400).send({
                        message: "user not in chat"
                    })
                }
            }).catch(error => {
                response.status(400).send({
                    message: "SQL Error 3",
                    error: error
                })
            })

}, (request, response) => {
    //Delete the memberId from the chat
    let insert = `DELETE FROM ChatMembers
                  WHERE ChatId=$1
                  AND MemberId=$2
                  RETURNING *`
    let values = [request.params.chatId, request.chatmemberid]
    pool.query(insert, values)
        .then(result => {
            response.send({
                success: true
            })
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error 4",
                error: err
            })
        })
    }
)

module.exports = router
