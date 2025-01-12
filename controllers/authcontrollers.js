import otpGenerator from "otp-generator";
import bcrypt from "bcrypt";
import pg from "pg"
import env from "dotenv";
import twilio from "twilio";

env.config();
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

const accountSID = process.env.TWILIO_ACC_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSID, authToken);

//register
const register = async(req, res) => {
  try{
  const { phone_no, password } = req.body;
  console.log(`phone_no: ${phone_no}`);
  console.log(`password is : ${password}`);

  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(`hased password: ${hashedPassword}`);

  const storeCredentials = await db.query("INSERT INTO users (phone_no, password) VALUES ($1, $2) RETURNING *", [phone_no, hashedPassword]);

  console.log(`phone_no and password stored in db: ${storeCredentials}`); // Debugging
  // res.status(200).json({ message: `registered successfully`})
  res.render("login.ejs");
}catch(err){
  console.log(`error registering: ${err}`)
  res.status(404).json({ message: `something went wrong`})
}
};

//Send OTP
const sendOTP = async(req, res) => {
  const { phone_no } = req.body;
  console.log("Received phone_no:", phone_no); // Debugging
  // console.log("Headers:", req.headers); // Debug headers
  console.log("Body:", req.body);       // Debug request body
  //validation check
  if (!phone_no) {
    return res.status(400).json({ message: "Phone number is required!" });
  }
 
  //Generating OTP
  const otp = otpGenerator.generate(6, { digits:true, lowerCaseAlphabets:false, upperCaseAlphabets: false, specialChars: false });

  console.log(`Generated OTP: ${otp}`); // Debugging
  //hashing otp
  bcrypt.hash(otp, 10, async(err, hash) => {
    if(err){
      console.log("error hashing otp");
    }else{
      //saving otp in db
      // const saveOTP = await db.query("INSERT INTO users (OTP) VALUES ($1)", [otp]);
      const saveOTP = await db.query("UPDATE users SET otp = $1 WHERE phone_no = $2", [hash, phone_no]);
      console.log(`otp saved in db: ${saveOTP}`); // Debugging
    }
  })
  //Twilio
  const formattedNo = `+91${phone_no}`; 
  
  try {
    await client.messages.create({
        body: `Your OTP is: ${otp}`,
        from: process.env.TWILIO_PHONE_NO,
        to: formattedNo
    });
    console.log(`OTP sent to ${phone_no}: ${otp}`);
    res.render("verify.ejs");

    // res.status(200).json({ message: 'OTP sent successfully!' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP.' });
  }

  //sending otp to phone_no
  console.log(`OTP sent to ${phone_no}: ${otp}`)
  // res.status(200).json({ message: `opt sent successfully`})
  // res.render("verify.ejs");
}

//Verify OTP
const verifyOTP = async(req, res) => {
  try{
    console.log("Entering try block")
    
  //user ke pass se otp lena
  const { phone_no, userOTP } = req.body;

  //Debug otp and mobile no
  console.log(`users No. ${phone_no}`);
  console.log(`users OTP. ${userOTP}`);

  const user = await db.query("SELECT * FROM users WHERE phone_no = $1", [phone_no]);
  console.log("checking otp in database");
  console.log("main jaarun catch block me!")
  // const user = await db.query("SELECT * FROM users WHERE otp = $1", [otp]);

  console.log("retreiveing data from database")
  // console.log(`user data: ${JSON.stringify(user)}`);
  if(!user || user.rows.length === 0){
    console.log("user not found")
    return res.json({message: `user is not found`})
  }
  
  //Extracting the user data from the database
  const userDbData = user.rows[0];
  // console.log(`userDbData: ${JSON.stringify(userDbData)}`);

 //cleaning the stored opt
 console.log(`cleaning the stored otp`);
 const userDbOTP = userDbData.otp;

 console.log(`userDbOTP: ${JSON.stringify(userDbOTP)}`);

 const storedOTP = userDbData.otp.trim();
// const storedOTP = userDbData?.otp ? userDbData.otp.trim() : null;

 console.log(`This is the stored OTP: ${JSON.stringify(storedOTP)}`);

 const isMatch = await bcrypt.compare(userOTP, storedOTP)
 if(isMatch){
  console.log(`otp matched`);
  console.log(`login successful`);
  const updateDb = `
    UPDATE users
    SET login_status = $1
    WHERE phone_no = $2
  `;
  await db.query(updateDb, ['Y', phone_no]);
  // await db.query("UPDATE users SET login_status = $1 WHERE phone_no = $2", [true, phone_no]);
  // If OTP is valid:
  req.session.userID = phone_no; // Store user ID in session
  req.session.isLoggedIn = true; // Set login status in session
  console.log('Session data:', req.session);

  // res.json({ message: 'Login successful!' });
  return res.render("home.ejs");
 }else{
  return res.status(404).json({ message: `Invalid otp`});
 }
/* The `}catch{}` block in the code snippet provided is attempting to catch any errors that may occur
during the execution of the `verifyOTP` function. If an error occurs within the `try` block of the
function, the code inside the `catch` block will be executed. */
}catch{
  console.log("error verifying otp");
  return res.status(404).json({ message: `something went wrong`});
}
};

//login
const login = async(req, res) => {
  try{
  const { phone_no, password} = req.body;
  console.log(`phone_no: ${phone_no}`);
  console.log(`password is : ${password}`);

  const user = await db.query("SELECT * FROM users WHERE phone_no = $1", [phone_no]);

  const userDbData = user.rows[0];

  if(!userDbData){
    return res.status(404).json({message: `user is not found`})
  }
  //cleaning stored password
  const storedPassword = userDbData.password.trim();
  console.log(`This is the stored password: ${storedPassword}`);

  const isMatch = await bcrypt.compare(password, storedPassword);
  console.log(`password matched`);
  if(isMatch){
    // res.status(200).json({ message: `login successful`})
    res.render("otp.ejs");
  }else{
    res.status(404).json({ message: `Invalid password`})
  }
}catch(err){
  console.log("Error in login", err);
  return res.status(500).json({ error: 'Something went wrong.' });
}
  
}

const logout = async(req, res) => {
  try {
    req.session.destroy((err) => {
        if (err) {
            console.log("Error destroying session:", err);
            return res.status(500).send("Could not log out. Please try again.");
        }
        res.clearCookie("connect.sid"); // Clear the session cookie
        res.status(200).send("Logout successful");
    });
} catch (err) {
    console.log("Error in logout controller:", err);
    res.status(500).send("An error occurred.");
}
 
}

export { register, sendOTP, verifyOTP, login, logout, db };