require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


const local_db = "mongodb://localhost:27017/BlogApp";
const online_db = process.env.URL;

// Creating a session
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUnitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(online_db);

const postsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  post_title: String,
  post_content: String
});

const Post = mongoose.model("Post", postsSchema);

const usersSchema = new mongoose.Schema({
  username: String,
  post: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  }]
});

usersSchema.plugin(passportLocalMongoose);
usersSchema.plugin(findOrCreate);

const User = mongoose.model("User", usersSchema);


passport.use(User.createStrategy());
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  scope: ["profile"],
  callbackURL: "https://blog-app-to22.onrender.com/auth/google/blog"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

app.get('/auth/google',
  passport.authenticate('google'));

  app.get('/auth/google/blog', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/blog');
  });
app.route("/")
  .get((req, res) => {
    res.render("home");
  })
app.route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post((req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const user = new User({
      username: username,
      password: password
    });
    req.login(user, function (err) {
      if (err) {
        res.send(err);
      } else {
        passport.authenticate("local")(req, res, function () {
          
          res.redirect("/blog");
        })
      }
    })
  })

app.route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    const username = req.body.username;
    const pswd = req.body.password;
    User.register({
      username: username
    }, pswd, (err, user) => {
      if (err) {
        res.redirect("/");
      } else {
        passport.authenticate("local", {
          failureRedirect: "/",
        })(req, res, () => {
          res.redirect("/blog");
        })
      }
    })
  });

  app.get("/logout",(req, res)=>{
    req.logOut(()=>{
      res.redirect("/");
    });
  })
app.get(
  "/blog", (req, res) => {
    if (req.isAuthenticated()) {
      Post.find().then((posts) => {
        res.render("blog", {
          posts: posts
        });
        
      }).catch((err) => {
        console.log(err)
      });
    } else {
      res.redirect("/");
    }
  }
);


app.get("/blog/posts/:postid", (req, res) => {

  if (req.isAuthenticated()) {
    let post_id = req.params.postid;
    let user_id = req.user._id;
    if (post_id === "myposts") {
      Post.find({
        user_id: user_id
      }).then((posts) => {
        res.render("personalposts", {
          posts: posts
        });
      }).catch((err) => res.send(err));
    } else {
      Post.findById(post_id).then((post) => {
        if (post) {
          res.render("post", {
            postTitle: post.post_title,
            postContent: post.post_content
          })
        }
      }).catch((err) => console.log(err));
    }
  } else
    res.redirect("/");
});
app.get("/personalposts", (req, res)=>{
  if(req.isAuthenticated())
  res.redirect("/blog/posts/myposts");
  else
  res.redirect("/");
})

app.get("/delete/:postId", (req, res)=>{
  const post_id = req.params.postId;
  if(req.isAuthenticated())
  {
    Post.findByIdAndDelete(post_id).then(()=>{
      res.redirect("/personalposts");
    })
  }
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
    if (req.isAuthenticated())
      res.render("compose");
    else
      res.redirect("/");
  }
);

app.post(
  "/compose", (req, res) => {
    const currentUserId = req.user._id;
    let newpost = new Post({
      user_id: currentUserId,
      post_title: req.body.title,
      post_content: req.body.content,
    });
    User.find({
      _id: currentUserId
    }).then(async (user) => {
      user[0].post.push(await newpost.save());
      res.redirect("/blog");
      // console.log(await newpost.save());
    })
    
  }
)




app.listen(3000, function () {
  console.log("Server started on port 3000");
});