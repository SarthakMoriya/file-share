const PORT = 3000
const express = require("express")
const app = express()
const multer = require('multer')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const File = require('./models/File')

dotenv.config({ path: './config.env' })

mongoose.connect(process.env.DATABASE_URL)

//MIDDLEWARE
const upload = multer({ dest: 'uploads' })
app.use(express.urlencoded({ extended: true }))


app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render("index")
})

app.post('/upload', upload.single('file'), async (req, res) => {

    const fileData = {
        path: req.file.path,
        originalName: req.file.originalname,
    }
    if (req.body.password != null && req.body.password !== "") {
        fileData.password = await bcrypt.hash(req.body.password, 10)
    }

    const file = await File.create(fileData)

    res.render("index", { fileLink: `${req.headers.origin}/file/${file.id}` })
})



app.route('/file/:id').get(handleDownload).post(handleDownload)

async function handleDownload(req, res) {
    const file = await File.findById(req.params.id)

    if (file.password != null) {
        if (req.body.password == null) {
            res.render("password")
            return
        }

        if (!(await bcrypt.compare(req.body.password, file.password))) {
            res.render("password", { error: true })
            return
        }
    }

    file.downloadCount++
    await file.save()
    console.log(file.downloadCount)

    res.download(file.path, file.originalName)
}

app.listen(process.env.PORT || PORT, (req, res) => {
    console.log(`App running on port:${PORT}`);
})
