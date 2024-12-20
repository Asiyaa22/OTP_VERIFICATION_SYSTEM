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

const verifyOTP = async(req, res) => {
  try{
  //user ke pass se otp lena
  const { phone_no, userOTP } = req.body;

  //Debug otp and mobile no
  console.log(`users No. ${phone_no}`);
  console.log(`users OTP. ${userOTP}`);

  const user = await db.query("SELECT * FROM users WHERE phone_no = $1", [phone_no]);

  const userDbData = user.rows[0];

  if(!userDbData){
    return res.status(404).json({message: `user is not found`})
  }
  
 //cleaning the stored opt

 const storedOTP = userDbData.otp.trim();
 console.log(`This is the stored OTP: ${hashedOTP}`);

 const isMatch = await bcrypt.compare(userOTP, storedOTP)
 if(isMatch){
  console.log(`otp matched`);
  res.status(200).json({ message: `otp verified`})
 }else{
  res.status(404).json({ message: `Invalid otp`})
 }
}catch{
  console.log("error verifying otp")
  res.status(404).json({ message: `something went wrong`})
}
  // bcrypt.hash(userOTP, 10, async(err, hash) => {
  //   if(err){
  //     console.log("error hashing user otp in verification", err)
  //   }else{
      //specific user ku nikalna

      // const hashedOTP = userDbData.otp;
      //debug
      // console.log(`this is the stored OTP: ${hashedOTP}`);
      //cleanign otp
      // const cleanOTP = hashedOTP.trim();
      //comparing otp provided by user with the OTP i have in store
      // const result = await bcrypt.compare(userOTP, cleanOTP);

      // console.log(result);
  //   }
  // })

  // res.status(200).json({ message: `opt verified`})
  
};

// export default sendOTP;
export { sendOTP, verifyOTP };