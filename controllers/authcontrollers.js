import otpGenerator from "otp-generator";
import bcrypt from "bcrypt";
import pg from "pg"
import env from "dotenv";

env.config();
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

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
  res.status(200).json({ message: `registered successfully`})
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
  //sending otp to phone_no
  console.log(`OTP sent to ${phone_no}: ${otp}`)
  res.status(200).json({ message: `opt sent successfully`})
}

//Verify OTP
const verifyOTP = async(req, res) => {
  try{
    
  //user ke pass se otp lena
  const { phone_no, userOTP } = req.body;

  //Debug otp and mobile no
  console.log(`users No. ${phone_no}`);
  console.log(`users OTP. ${userOTP}`);

  const user = await db.query("SELECT * FROM users WHERE phone_no = $1", [phone_no]);
  
  console.log("retreiveing data from database")
  console.log(`user data: ${user}`);

  const userDbData = user.rows[0];
  console.log(`userDbData: ${userDbData}`);
  if(!userDbData){
    console.log("user not found")
    return res.status(404).json({message: `user is not found`})
  }
  
 //cleaning the stored opt
 console.log(`cleaning the stored otp`);
 const userDbOTP = userDbData.otp;

 console.log(`userDbOTP: ${userDbOTP}`);

 const storedOTP = userDbData.otp.trim();
// const storedOTP = userDbData?.otp ? userDbData.otp.trim() : null;

 console.log(`This is the stored OTP: ${storedOTP}`);

 const isMatch = await bcrypt.compare(userOTP, storedOTP)
 if(isMatch){
  console.log(`otp matched`);
  res.status(200).json({ message: `otp verified`})
 }else{
  res.status(404).json({ message: `Invalid otp`})
 }
/* The `}catch{}` block in the code snippet provided is attempting to catch any errors that may occur
during the execution of the `verifyOTP` function. If an error occurs within the `try` block of the
function, the code inside the `catch` block will be executed. */
}catch{
  console.log("error verifying otp")
  res.status(404).json({ message: `something went wrong`})
}
};

//login
const login = async(req, res) => {
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
    res.status(200).json({ message: `login successful`})
  }else{
    res.status(404).json({ message: `Invalid password`})
  }
}

export { register, sendOTP, verifyOTP, login };