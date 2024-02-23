if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const ExpressError = require("./utils/ExpressError.js");
// for put/delete request in form
const methodOverride = require("method-override"); 
const ejsMate = require("ejs-mate");
const path = require("path");

const session = require("express-session");
const flash = require("connect-flash");
// To create & store session on cloud
const mongoStore = require("connect-mongo");

//To Use Express Router
const listingRouter = require("./routes/listing.js"); 
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// Authenitication
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const MongoStore = require("connect-mongo");

const app = express();   
const port = 8080;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.engine("ejs", ejsMate); //To use boiler plate code
app.use(express.static(path.join(__dirname, "public")));

app.use(methodOverride("_method"));

app.listen(port, () => {
    console.log("app is listening at port 8080...");
});


const dbUrl = process.env.ATLASDB_URL;

//session store on cloud
const store = MongoStore.create({
    mongoUrl : dbUrl,
    crypto : {
        secret : process.env.SECRET
    },
    touchAfter : 24 * 60*60
})

store.on("error", ()=>{
    console.log("Error in mongo session store", error);
})

const sessionOptions = {
    store,
    secret :  process.env.SECRET,
    resave : false,
    saveUninitialized : true,
    cookie : {
        expires : Date.now() + 7 * 24 * 60 * 60 * 1000,    
        maxAge : 7 * 24 * 60 * 60 * 1000,
        httpOnly : true,
    }
}

app.use(session(sessionOptions));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    // To check user is logged in or not (used req.user)
    res.locals.currUser = req.user;
    next();
})


async function main() {
    await mongoose.connect(dbUrl);
}

main().then((res) => {
    console.log("connected to database");
}).catch((err) => {
    console.log("error in connection");
})


// Routing
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);


//// for all route other than above
app.use("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found"));

})

// Error handling middleware
app.use((err, req, res, next) => {
    let { status = 500, message = "Something went wrong!" } = err;
    res.render("error.ejs",{err});
})



