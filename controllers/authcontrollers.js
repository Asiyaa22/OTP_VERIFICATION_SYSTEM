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

//Send OTP
const sendOTP = async(req, res) => {
  const { phone_no } = req.body;
  console.log("Received phone_no:", phone_no); // Debugging
  console.log("Headers:", req.headers); // Debug headers
  console.log("Body:", req.body);       // Debug request body
  //validation check
  if (!phone_no) {
    return res.status(400).json({ message: "Phone number is required!" });
  }
  //saving ph no in db
  //const saveNum = await db.query("INSERT INTO users (phone_no) VALUES ($1) ON CONFLICT (phone_no) DO NOTHING  RETURNING *", [phone_no]);

  const password = req.body.password || "default_password";
  const query = "INSERT INTO users (phone_no, password) VALUES ($1, $2) RETURNING *";
 await db.query(query, [phone_no, password]);

  //Generating OTP
  const otp = otpGenerator.generate(6, { digits:true, lowerCaseAlphabets:false, upperCaseAlphabets: false, specialChars: false });
  //hashing otp
  bcrypt.hash(otp, 10, async(err, hash) => {
    if(err){
        console.log("error hashing otp");
    }else{
        //saving otp in db
        const saveOTP = await db.query("INSERT INTO users (OTP) VALUES ($1)", [otp]);
    }
  })
  //sending otp to phone_no
  console.log(`OTP sent to ${phone_no}: ${otp}`)
  res.status(200).json({ message: `opt sent successfully`})
}

export default sendOTP;