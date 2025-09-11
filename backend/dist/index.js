import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
app.use(cors());
const port = process.env.PORT || 4040;
app.get("/", (req, res) => {
    res.send("HEllo welcome to the Home  page");
});
app.listen(port, () => {
    console.log(`The Backend is running on http://localhost:${port} `);
});
//# sourceMappingURL=index.js.map