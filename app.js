const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require("path");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Load user data from JSON file
const loadUsers = () => {
    const data = fs.readFileSync('./data/users.json', 'utf8');
    return JSON.parse(data);
  };

app.use(bodyParser.urlencoded({
    extended: true
  }));





// Home Page or Login Page
app.get("/", (req, res) => {
	res.render("form",{type:'Login'});
});

//Login User 
app.post('/login', async (req, res) => {
    try {
        
        const { username, password } = req.body;
        const users = loadUsers().users;
        
        // Find the user (Replace with database query in production)
        const user = users.find(user => user.username === username);

        // Check if the user exists
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    
        // Compare the provided password with the stored hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if(user.isAdmin)
        {
            userList=[];
            users.forEach(user => {
                obj={'username':user.username, 'isAdmin':user.isAdmin};
                userList.push(obj)
            });
            res.render('admin_home', {users:userList, username:username});
        }
        else
        {
            res.render('user_home', {username:username });
        }
        
        
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
});


//Take User to Signup Page
app.get('/signup', function(req,res){
    res.render('form',{type:'Signup'});
});


//SignUp User
app.post('/signup', (req, res) => {
    const { username, password } = req.body;
  
    const users = loadUsers().users;
  
    // Check if the username already exists
    if (users.some((user) => user.username === username)) {
      return res.status(400).json({ message: 'Username already exists.' });
    }
  
    // Hash the password
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) throw err;
  
        // Save the new user
        const newUser = {
          id: users.length + 1,
          username,
          password: hash,
          isAdmin: false,
        };
  
        users.push(newUser);
        fs.writeFileSync('./data/users.json', JSON.stringify({ users }), 'utf8');
  
        res.render('user_home',{username:username});
      });
    });
  });


//Change Admin status of User.
app.post('/changeAdminStatus/:newadmin_username/:username',async(req,res)=>{

    const username= req.params.username;
    const newadmin_username= req.params.newadmin_username;
    const users = loadUsers().users;
    const user=users.find((u) => u.username ===username);

    //Check if person doing this is Admin.
    if(!user.isAdmin)
    {
        return res.status(404).json({ message: 'User is not admin' });
    }

    const targetUser = users.find((u) => u.username === newadmin_username);
  
    //Check if target User Exists
    if (!targetUser) {
        return res.status(404).json({ message: 'User not found.' });
    }

    //Change Admin Type
    targetUser.isAdmin = ! targetUser.isAdmin;

    //Commit to DB
    fs.writeFileSync('./data/users.json', JSON.stringify({ users }), 'utf8');

    userList=[];
    users.forEach(user => {
        obj={'username':user.username, 'isAdmin':user.isAdmin};
        userList.push(obj)
    });
    
    res.render('admin_home', {users:userList, username:username});
        
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


