const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const URI = process.env['MONGO_URI']


require('dotenv').config()
mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true });
app.use(bodyParser.urlencoded({ extended: false }))

let userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});

let exerciseSchema = new mongoose.Schema({
  username: { type: String, required: true },
  description: String,
  duration: Number,
  date: String,
  userid: String
});

let logSchema = new mongoose.Schema({
  count: Number,
  log: {
    type: [{
      desription: { type: String },
      duration: { type: Number },
      date: { type: Date }
    }]
  }
});

let User = mongoose.model('User', userSchema);
let Excercise = mongoose.model('Excercise', exerciseSchema);
let Log = mongoose.model('Log', logSchema);

app.use(cors())
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/users", function(req, res, next) {
  User.find()
    .then(function(doc) {
      res.json(doc);
    });
});

app.post("/api/users", function(req, res, next) {
  var newUser = new User({ username: req.body.username });
  newUser.save();
  res.json(newUser)
});



app.post("/api/users/:_id/exercises", async function(req, res, next) {

  try {
    const date = req.body.date ? new Date(req.body.date) : new Date();
    const id = new mongoose.Types.ObjectId(req.params._id);
    var user = await User.findById({ _id: id })
    //console.log("user:", user)
    //processDoc(doc);
    //const dateString = date.toDateString()
    //console.log(dateString)
    var newExcercise = new Excercise({
      username: user.username,
      description: req.body.description,
      duration: Number(req.body.duration),
      date: date.toDateString(),
      userid: user._id
    });
    newExcercise.save();
    res.json({
      username: user.username,
      _id: user._id,
      description: req.body.description,
      duration: Number(req.body.duration),
      date: date.toDateString()
    })
  } catch (err) {
    console.log(err)
  }
});

app.get("/api/users/:_id/logs", async function(req, res, next) {
  try {
    //console.log("params", req.params)
    console.log("query", req.query)
    //console.log("from", req.params.from, "to", req.params.to, "limit",req.params.limit)
    const id = new mongoose.Types.ObjectId(req.params._id);
    //console.log("id ", id)
    var user = await User.findById({ _id: id })
    var excercises = await Excercise.find({ userid: req.params._id })
    //console.log("User:", user)
    
    var logs = [...excercises].map(excercise => ({ description: excercise.description, duration: excercise.duration, date: excercise.date }));
    console.log("logs",logs)
    // filter by date
    if(req.query.from && req.query.to){
      console.log("Date filter")
      console.log("logs",logs)
      logs = logs.filter((item) =>
    new Date(item.date).getTime() >= new Date(req.query.from).getTime() && new Date(item.date).getTime() <= new Date(req.query.to).getTime()
);
      
      console.log("logs",logs)
    }
    if(req.query.limit){
      console.log("limit filter")
      logs = logs.slice(0, Number(req.query.limit));
      console.log("logs", logs)
    }
    
    res.json({
      username: user.username,
      count: logs.length,
      _id: id,
      log: logs
    }) 
  } catch (err) {
    console.log(err)
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
