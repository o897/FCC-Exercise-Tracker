const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

// model
mongoose
  .connect(process.env["MONGO_URL"], {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB connection failed"));

const Schema = mongoose.Schema;

// User Model Schema
const userSchema = new Schema({
  username: String,
});

// model is the name of our collection it should be singular
const UserModel = mongoose.model("user", userSchema);
// End user model

// Exercise Model Schema

const exerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date,
  userId: String,
});

const ExerciseModel = mongoose.model("exercise", exerciseSchema);

// End Exercise Model

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Create a new user
app.post("/api/users", (req, res) => {
  try {
    const username = req.body.username;

    const newuser = new UserModel({ username: username });

    newuser.save();

    res.send(newuser);
  } catch (err) {
    console.log(err);
  }
});

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const allUsers = await UserModel.find({});
    res.send(allUsers);
  } catch (err) {
    console.log("Error fetching users: ", err);
  }
});

// Post new exercise
app.post("/api/users/:_id/exercises", async (req, res) => {
  var date = req.body.date;

  if (!date) {
    date = new Date().toDateString();
  }

  try {
    const findUser = await UserModel.findOne({ _id: req.params._id });

    let exerciseObj = {
      userId: findUser._id,
      username: findUser.username,
      description: req.body.description,
      duration: req.body.duration,
      date: date,
    };

    if (findUser) {
      const newExercise = new ExerciseModel(exerciseObj);

      newExercise.save();

      exerciseObj["_id"] = exerciseObj["userId"];
      delete exerciseObj["userId"];

      res.json({
        username: findUser.username,
        _id: findUser._id,
        description: newExercise.description,
        duration: newExercise.duration,
        date: newExercise.date.toDateString(),
      });
    } else {
      res.send("User does not exist.");
    }
  } catch (err) {
    console.log(err);
  }
});

// logs route
app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    let limit = req.query.limit;
    let from = req.query.from;
    let to = req.query.to;

    const { _id, username } = await UserModel.findOne({ _id: req.params._id });

    const query = { userId: _id };

    limit = parseInt(limit);

    // if any of this are set create a date object within the query object
    if (from || to) {
      query.date = {};
    }

    if (from) {
      query.date.$gte = new Date(from);
    }

    if (to) {
      query.date.$lte = new Date(to);
    }

    // query db directly and is async returns a Promise (I promise to do your task meanwhile continue ith other tasks), using length is sync no waiting periods (first give me cheese before I continue)
    // const countDocs = await ExerciseModel.countDocuments({ userId: _id });

    let log = await ExerciseModel.find(query).limit(limit);

    log = log.map((exercises) => {
      return {
        description: exercises.description,
        duration: exercises.duration,
        date: exercises.date.toDateString(),
      };
    });

    if (log) {
      res.json({
        username: username,
        count: log.length,
        _id: _id,
        log,
      });
    } else {
      res.send("No Exercise records found.");
    }
  } catch (err) {
    console.log(err);
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
