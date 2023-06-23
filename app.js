

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


const local_db = "mongodb://localhost:27017/BlogApp";
const online_db = "mongodb+srv://rishi:Password@blogdatabase.zm6kuqo.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(online_db);

const postsSchema = new mongoose.Schema({
  post_title : String,
  post_content: String
});

const Post = mongoose.model("Post", postsSchema);


app.get(
  "/", (req, res) => {
    Post.find().then((posts)=>{
      res.render("home", {
        posts: posts
      });
    }).catch((err)=>{console.log(err)});
    

  }
);


app.get("/posts/:postid", (req, res)=>{
  let post_id = req.params.postid;
  Post.findById(post_id).then((post)=>{
    if(post){
      res.render("post", {
        postTitle: post.post_title,
        postContent: post.post_content
      })
    }
  }).catch((err)=>console.log(err));

});

app.get(
  "/about", (req, res) => {
    res.render("about");
  }
);
app.get(
  "/contact", (req, res) => {
    res.render("contact");
  }
);

app.get(
  "/compose", (req, res) => {
    res.render("compose");
  }
);

app.post(
  "/compose", (req, res)=> {
   let post = new Post({
      post_title: req.body.title,
      post_content: req.body.content,
   });
   post.save();
   res.redirect("/");
  }
)




app.listen(3000, function () {
  console.log("Server started on port 3000");
});