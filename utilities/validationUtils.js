
/**
 * Checks the parameter to see if it is a a String with a length greater than 0.
 * 
 * @param {string} param the value to check
 * @returns true if the parameter is a String with a length greater than 0, false otherwise
 */
let isStringProvided = (param) => 
    param !== undefined && param.length > 0

function isValidPassword(str){
  let regEx = new RegExp('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{4,})')
  return regEx.test(str);
}

function isValidEmail(str){
  let regEx = new RegExp('[a-z0-9]+@[a-z]+\.[a-z]{2,3}$')
  return regEx.test(str);
}
// Feel free to add your own validations functions!
// for example: isNumericProvided, isValidPassword, isValidEmail, etc
// don't forget to export any 


  
module.exports = { 
  isStringProvided,
  isValidPassword,
  isValidEmail
}