import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import workflowRoutes from './routes/workflowRoutes.js'
import webhookRoutes from './routes/webhookRoutes.js'
dotenv.config();

const app=express();
app.use(cors());
const port = process.env.PORT || 4040;

app.get("/",(req,res)=>{
    res.send("HEllo welcome to the Home  page");
})
app.use('/workflow', workflowRoutes);
app.use('/webhook', webhookRoutes);


app.listen(port,()=>{
    console.log(`The Backend is running on http://localhost:${port} `);
})