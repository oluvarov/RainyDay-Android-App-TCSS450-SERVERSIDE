const express = require('express');  
const app = express();  
app.use(express.json())


app.get('/', (req, res) => res.sendFile('views/index.html', { root: '.' }));  

app.listen(process.env.PORT || 5000, () => {
    console.log("Server up and running on port: " + (process.env.PORT || 5000));
});