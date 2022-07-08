/*********************************************************************************
 * WEB322 – Assignment 03
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy.
 * No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
 *
 * Name: Jay Pravinkumar Chaudhari
 * Student ID: 147268205
 * Date: 16/06/2022
 *
 * Online (Heroku) URL: https://afternoon-ocean-60644.herokuapp.com/
 *
 * GitHub Repository URL: https://github.com/JayAtSeneca/web322-app
 *
 ********************************************************************************/

var express = require("express");
var app = express();
var blogService = require("./blog-service");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const path = require("path");
const exphbs = require("express-handlebars");

var HTTP_PORT = process.env.PORT || 8080;

cloudinary.config({
  cloud_name: "dltn1ghdm",
  api_key: "884661395299724",
  api_secret: "8ZDycm8695UflqV_kEC0D26s-3k",
  secure: true,
});

// handlebars setup
app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    defaultLayout: "main",
    helpers: {
      navLink: function (url, options) {
        return (
          "<li" +
          (url == app.locals.activeRoute ? ' class="active" ' : "") +
          '><a href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      safeHTML: function (context) {
        return stripJs(context);
      },
    },
  })
);
app.set("view engine", ".hbs");
app.set("views", "./views");

const upload = multer();

function onHttpStart() {
  console.log("Express http server listening on port: " + HTTP_PORT);
}

app.use(express.static("public"));

// middleware
app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.get("/", (req, res) => {
  res.redirect("/about");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/blog", (req, res) => {
  blogService
    .getPublishedPosts()
    .then((data) => {
      console.log("getPublishedPosts displayed.");
      res.json(data);
    })
    .catch((err) => {
      console.log("ERROR MESSAGE:", err.message);
      res.json(err);
    });
});

app.get("/posts", (req, res) => {
  if (req.query.category) {
    blogService
      .getPostByCategory(req.query.category)
      .then((posts) => {
        console.log("getAllPosts by category displayed.");
        res.render('posts',{ posts });
      })
      .catch((err) => {
        console.log("ERROR MESSAGE:", err.message);
        res.render("posts", {message: "no results"});
      });
  } else if (req.query.minDate) {
    blogService
      .getPostByMinDate(req.query.minDate)
      .then((posts) => {
        console.log("getAllPosts by minDate displayed.");
        res.render('posts',{ posts });
      })
      .catch((err) => {
        console.log("ERROR MESSAGE:", err.message);
        res.render("posts", {message: "no results"});
      });
  } else {
    blogService
      .getAllPosts()
      .then((posts) => {
        console.log("getAllPosts displayed.");
        res.render('posts',{ posts });
      })
      .catch((err) => {
        console.log("ERROR MESSAGE:", err.message);
        res.render("posts", {message: "no results"});
      });
  }
});

app.get("/post/:id", (req, res) => {
  blogService
    .getPostById(req.params.id)
    .then((data) => {
      console.log("getPostById displayed.");
      res.json(data);
    })
    .catch((err) => {
      console.log("ERROR MESSAGE:", err.message);
      res.json(err);
    });
});

app.get("/categories", (req, res) => {
  blogService
    .getCategories()
    .then((data) => {
      console.log("getCategories displayed.");
      res.json(data);
    })
    .catch((err) => {
      console.log("ERROR MESSAGE:", err.message);
      res.json(err);
    });
});

app.get("/posts/add", function (req, res) {
  res.render("addPost");
});

app.post("/posts/add", upload.single("featureImage"), (req, res) => {
  let streamUpload = (req) => {
    return new Promise((resolve, reject) => {
      let stream = cloudinary.uploader.upload_stream((error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      });

      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
  };

  async function upload(req) {
    let result = await streamUpload(req);
    console.log(result);
    return result;
  }

  upload(req).then((uploaded) => {
    req.body.featureImage = uploaded.url;

    blogService
      .addPost(req.body)
      .then((data) => {
        res.redirect("/posts");
      })
      .catch((err) => {
        console.log("ERROR MESSAGE:", err.message);
      });
  });
});

app.use((req, res) => {
  res.status(404).send("Page Not Found");
});

console.log("Ready for initialize");
blogService
  .initialize()
  .then(() => {
    console.log("starting the server");
    app.listen(HTTP_PORT, onHttpStart);
  })
  .catch((err) => {
    console.log("ERROR MESSAGE:", err.message);
  });
