if (process.env.NODE_ENV !== "production") {
    require('dotenv').config()
}

const exp = require('express')
const app = exp()
const mongoose = require('mongoose')
const path = require('path')
const methodOverride = require('method-override')
const engine = require('ejs-mate')
const ExpressError = require('./utils/ExpressError')
const session = require('express-session')
const flash = require('connect-flash')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const User = require('./models/user')
const mongoSanitize = require('express-mongo-sanitize')
const reviewroutes = require('./routes/reviews')
const campgroundroutes = require('./routes/campground')
const userRoutes = require('./routes/users')
const helmet = require('helmet')
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/YelpCamp'
const MongoStore = require('connect-mongo');


main().catch(err => console.log(err));

// 'mongodb://localhost:27017/YelpCamp'
async function main() {
    try {
        await mongoose.connect(dbUrl);
        console.log('mongoose connected')
    }
    catch (e) {
        console.log('oh no,,mongoose error')
        console.log(e)
    }
}

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, "views"))


app.use(exp.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use(exp.static(path.join(__dirname, 'public')))
app.use(mongoSanitize({
    replaceWith: '_'
}))
// app.use(helmet())

const secret = process.env.SECRET || 'thishouldbeabettersecret';

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret
    }
});

store.on('error',function(e){
    console.log('SESSION STORE ERROR',e)
})

const sessionconfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}


const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net/",
    "https://res.cloudinary.com/dv5vm4sqh/"
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net/",
    "https://res.cloudinary.com/dv5vm4sqh/"
];
const connectSrcUrls = [
    "https://*.tiles.mapbox.com",
    "https://api.mapbox.com",
    "https://events.mapbox.com",
    "https://res.cloudinary.com/dv5vm4sqh/"
];
const fontSrcUrls = [ "https://res.cloudinary.com/dv5vm4sqh/" ];
 
app.use(
    helmet.contentSecurityPolicy({
        directives : {
            defaultSrc : [],
            connectSrc : [ "'self'", ...connectSrcUrls ],
            scriptSrc  : [ "'unsafe-inline'", "'self'", ...scriptSrcUrls ],
            styleSrc   : [ "'self'", "'unsafe-inline'", ...styleSrcUrls ],
            workerSrc  : [ "'self'", "blob:" ],
            objectSrc  : [],
            imgSrc     : [
                "'self'",
                "blob:",
                "data:",
                `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`, //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
                "https://images.unsplash.com/"
            ],
            fontSrc    : [ "'self'", ...fontSrcUrls ],
            mediaSrc   : [ "https://res.cloudinary.com/dv5vm4sqh/" ],
            childSrc   : [ "blob:" ]
        },
        // crossOriginEmbedderPolicy: false
    })
);


app.use(session(sessionconfig))
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use((req, res, next) => {
   
    res.locals.currentUser = req.user
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    next()
})

app.get('/fakeuser', async (req, res) => {
    const user = new User({ email: 'colttt@gmail.com', username: 'colttt' })
    const newUser = await User.register(user, 'chicken')
    res.send(newUser)
})

app.engine('ejs', engine)

app.use('/', userRoutes)
app.use('/campgrounds', campgroundroutes)
app.use('/campgrounds/:id/reviews', reviewroutes)

app.get('/', (req, res) => {
    res.render('home')
})

app.all('*', (req, res, next) => {
    next(new ExpressError('Page not Found', 404))
})

app.use((err, req, res, next) => {
    const { status = 500 } = err
    if (!err.message) err.message = 'Oh no, Something went wrong'
    res.status(status).render('error', { err });
})

app.listen(3000, () => {
    console.log('listening on 3000 port')
})