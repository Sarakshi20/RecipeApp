const {
    app,
    User
} = require('./database');
const PORT = 3000;
const passport = require("passport");

//multer disk setup
const multer = require('multer')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        return cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({
    storage: storage
})


// express Routes

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});


// login Routes
app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect("/profile");
    } else {
        res.sendFile(__dirname + '/public/login.html')
    }
});

app.post('/login', (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function (err) {
        if (err) {
            console.log(err);
            res.redirect("/login");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect('/profile');
            });
        }
    });
})


//signup Routes

app.get('/signup', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect("/profile");
    } else {
        res.sendFile(__dirname + '/public/signup.html')
    }
});


app.post('/signup', (req, res) => {
    User.register({
        username: req.body.username,
        email: req.body.email
    }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/signup");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect('/profile');
            });
        }
    });
})


// profile Routes
app.get('/profile', async (req, res) => {
    try {
        let foundUser = await User.findById(req.user.id).exec();
        if (req.isAuthenticated() && foundUser) {
            res.render(__dirname + '/public/profile.ejs', {
                usersName: foundUser
            });
        } else {
            res.redirect('/login');
        }
    } catch {
        res.redirect('/login');
    }
})


// recipes Routes
app.get('/recipes', async (req, res) => {
    let UsersWithRecipes = await User.find({}, ['recipes']);
    res.render(__dirname + '/public/recipes.ejs', {
        UserRecipes: UsersWithRecipes
    })
})


// myRecipes Routes
app.get('/myRecipes', async (req, res) => {
    try {
        let foundUser = await User.findById(req.user.id).exec();
        if (req.isAuthenticated() && foundUser) {
            let recipes = foundUser.recipes;
            res.render(__dirname + '/public/userRecipes.ejs', {
                userRecipes: recipes
            });
        } else {
            res.redirect('/login');
        }
    } catch {
        res.redirect('/login');
    }
})


app.post('/myRecipes', upload.single("RecipeImage"), async (req, res) => {
    try {
        let foundUser = await User.findById(req.user.id).exec();
        if (req.isAuthenticated() && foundUser) {
            let currentTime = new Date();
            let currentOffset = currentTime.getTimezoneOffset();
            let ISTOffset = 330;
            var ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset) * 60000);
            let newRecipe = {
                authorName: req.body.auth,
                recipeName: req.body.Recipe,
                ingredients: req.body.Ingredients,
                desc: req.body.desc,
                instructions : req.body.instructions,
                date: ISTTime.getDate() + "/" + ISTTime.getMonth() + "/" + ISTTime.getFullYear(),
                imagePath: req.file.path
            }
            await User.findByIdAndUpdate(foundUser.id, {
                "$push": {
                    "recipes": newRecipe
                }
            });
            res.redirect('/recipes');
        } else {
            res.redirect('/myRecipes');
        }
    } catch {
        res.redirect('/myRecipes');
    }
})



// logout Route
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.log(err)
        } else {
            res.redirect("/");
        }
    });
});


//ViewRecipe Route
app.get('/viewRecipe/:recipeId', async (req, res) => {
    try {
        const recipeId = req.params.recipeId;

        // Find the user with the recipe that matches the recipeId
        const userWithRecipe = await User.findOne({ 'recipes._id': recipeId });

        if (!userWithRecipe || !userWithRecipe.recipes || userWithRecipe.recipes.length === 0) {
            // Handle the case where the recipe is not found
            return res.status(404).send('Recipe not found');
        }

        // Extract the found recipe from the array
        const foundRecipe = userWithRecipe.recipes.find(recipe => String(recipe._id) === recipeId);

        // Render the ViewRecipe.ejs template and pass the recipe data
        res.render(__dirname + '/public/ViewRecipe.ejs', { recipe: foundRecipe });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});



app.listen(PORT, () => {
    console.log("Server has started");
})