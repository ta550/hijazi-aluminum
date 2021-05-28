var sqlite3 = require('sqlite3').verbose();
var cloudinary = require('cloudinary').v2;
var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var db = new sqlite3.Database('hijazi.db');
var path = require('path');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var fileupload = require("express-fileupload");
var port = process.env.PORT || 3000;

app.use(fileupload({
    useTempFiles : true,
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.set('trust proxy', 1);
app.use(session({secret: "This is Session Secret Key if you want to knwo please contact me on my whatsapp no +9223423424"}));

cloudinary.config({ 
    cloud_name: 'mentor-sol', 
    api_key: '198961961417589', 
    api_secret: 'Tu1jOkbJp6TUQrLLVv4dTTJITXI' 
});

db.run('CREATE TABLE IF NOT EXISTS facadeImages(public_id TEXT, url TEXT, type TEXT)');
db.run('CREATE TABLE IF NOT EXISTS compositeImages(public_id TEXT, url TEXT, type TEXT)');
db.run('CREATE TABLE IF NOT EXISTS glassArtImages(public_id TEXT, url TEXT, type TEXT)');


app.set("view engine", "hbs");

app.use(express.static(path.join(__dirname,"views")))
app.get("/admin/facade", (req,res) => {
    db.get("select * from facadeImages where type = 'main'",(err,mainImage) => {
        db.all("select * from facadeImages where type = 'inner'", (err, innerImages) => {
            // res.send(innerImages);
            res.render("facade.hbs", {
                title: "Admin Panel | Hijazi",
                facadeMainImage: mainImage,
                facadeInnerImages: innerImages
            });
        })
    });
    
})

app.get("/admin/composite", (req,res) => {
    db.get("select * from compositeImages where type = 'main'",(err,mainImage) => {
        db.all("select * from compositeImages where type = 'inner'", (err, innerImages) => {
            // res.send(innerImages);
            res.render("composite.hbs", {
                title: "Admin Panel | Aluminum Composite Images",
                compositeMainImage: mainImage,
                compositeInnerImages: innerImages
            });
        })
    });
    
})


app.get("/admin/glassArt",  (req,res) => {
    db.get("select * from glassArtImages where type = 'main'",(err,mainImage) => {
        db.all("select * from glassArtImages where type = 'inner'", (err, innerImages) => {
            // res.send(innerImages);
            res.render("glassArt.hbs", {
                title: "Admin Panel | Aluminum glassArt Images",
                glassArtMainImage: mainImage,
                glassArtInnerImages: innerImages
            });
        })
    });
    
})



app.get('/login', (req,res) => {
    res.render('login.hbs');
})


app.get('/', (req, res) => {
    db.get("select * from glassArtImages where type = 'main'",(err,gmainImage) => {
        db.get("select * from compositeImages where type = 'main'",(err,cmainImage) => {
            db.get("select * from facadeImages where type = 'main'",(err,fmainImage) => {
                res.render('hijazi',{
                    facadeImage: fmainImage,
                    glassArtImage: gmainImage,
                    compositeImage: cmainImage
                });
            });
        });
    });
})

app.get('/facade', (req, res) => {
    db.get("select * from facadeImages where type = 'main'",(err,fmainImage) => {
        db.all("select * from facadeImages where type = 'inner'", (err, innerImages) => {
            res.render('facadeWeb', {
                images: innerImages,
                mainImage: fmainImage
            });
        });
    });
})

app.get('/composite', (req, res) => {
    db.get("select * from compositeImages where type = 'main'",(err,cmainImage) => {
        db.all("select * from compositeImages where type = 'inner'", (err, innerImages) => {
            res.render('compositeWeb', {
                images: innerImages,
                mainImage: cmainImage
            })
        });
    });
})

app.get('/about', (req,res) => {
    res.render('aboutWeb');
})

app.get("/glassArt", (req, res) => {
    db.get("select * from glassArtImages where type = 'main'",(err,gmainImage) => {
        db.all("select * from glassArtImages where type = 'inner'", (err, innerImages) => {
            res.render('glassArtWeb', {
                mainImage: gmainImage,
                images: innerImages
            });
        });
    });
})

// Facade Images
app.post("/facade/main/upload", (req,res) => {
    var file;
    if (!req.files) {
        res.send("Image Not Found");
    }
    file = req.files.facadeMainImage;
    // console.log(file);
    cloudinary.uploader.upload(file.tempFilePath, (err,result) => {
        if (err) {
            console.log(err);
            res.send("Some Went Wrong!!")
        }else {
            // var mainImage = db.run("select * from facadeImages where type = 'main'");
            db.get("select * from facadeImages where type = 'main'",(err,mainImage) => {
                if (err) throw err;
                // console.log(mainImage);
                if (!mainImage) {
                    db.run(`insert into facadeImages (url, type, public_id) values('${result.url}', "main", '${result.public_id}')`);
                }else {
                    db.run(`update facadeImages set url='${result.url}', public_id='${result.public_id}' where type='main'`);
                    console.log(result);
                }
                res.redirect('/admin/facade');
            });
            
        }
    })
    // res.send("hello worldj");
})

app.post("/facade/upload",  (req,res) => {
    if (!req.files) {
        res.send("Images not Found!!");
    }
    files = req.files.facadeMainImage;
    var loop = false;
    var loopCount = 0;
    for (const file of files) {
        cloudinary.uploader.upload(file.tempFilePath, (err,result) => {
            if (err) throw err;
            db.run(`insert into facadeImages (url, type, public_id) values('${result.url}', "inner", '${result.public_id}')`);
            loopCount = loopCount + 1;
            if (loopCount == files.length) {
                console.log(loopCount + " This is Equal to "+ files.length);
                res.redirect("/admin/facade");
            }
        });
    }
    // res.send('Some Went Wrong!!');
})

app.get('/facade/delete/:public_id', (req, res) => {
    var public_id = req.params.public_id;
    cloudinary.uploader.destroy(public_id, (err,result) => {
        if (err) throw err;
        console.log("cloudinary Result", result);
        db.run(`DELETE from facadeImages where public_id = ?`, public_id, (err, result) => {
            if (err) throw err;
            res.redirect("/admin/facade")
        })
    })
})



// composite Images
app.post("/composite/main/upload", (req,res) => {
    var file;
    if (!req.files) {
        res.send("Image Not Found");
    }
    file = req.files.compositeMainImage;
    // console.log(file);
    cloudinary.uploader.upload(file.tempFilePath, (err,result) => {
        if (err) {
            console.log(err);
            res.send("Some Went Wrong!!")
        }else {
            // var mainImage = db.run("select * from compositeImages where type = 'main'");
            db.get("select * from compositeImages where type = 'main'",(err,mainImage) => {
                if (err) throw err;
                // console.log(mainImage);
                if (!mainImage) {
                    db.run(`insert into compositeImages (url, type, public_id) values('${result.url}', "main", '${result.public_id}')`);
                }else {
                    db.run(`update compositeImages set url='${result.url}', public_id='${result.public_id}' where type='main'`);
                    console.log(result);
                }
                res.redirect('/admin/composite');
            });
            
        }
    })
    // res.send("hello worldj");
})

app.post("/composite/upload", (req,res) => {
    if (!req.files) {
        res.send("Images not Found!!");
    }
    files = req.files.compositeMainImage;
    var loop = false;
    var loopCount = 0;
    for (const file of files) {
        cloudinary.uploader.upload(file.tempFilePath, (err,result) => {
            if (err) throw err;
            db.run(`insert into compositeImages (url, type, public_id) values('${result.url}', "inner", '${result.public_id}')`);
            loopCount = loopCount + 1;
            if (loopCount == files.length) {
                console.log(loopCount + " This is Equal to "+ files.length);
                res.redirect("/admin/composite");
            }
        });
    }
    // res.send('Some Went Wrong!!');
})

app.get('/composite/delete/:public_id', (req, res) => {
    var public_id = req.params.public_id;
    cloudinary.uploader.destroy(public_id, (err,result) => {
        if (err) throw err;
        console.log("cloudinary Result", result);
        db.run(`DELETE from compositeImages where public_id = ?`, public_id, (err, result) => {
            if (err) throw err;
            res.redirect("/admin/composite")
        })
    })
})




// glassArt Images
app.post("/glassArt/main/upload", (req,res) => {
    var file;
    if (!req.files) {
        res.send("Image Not Found");
    }
    file = req.files.glassArtMainImage;
    // console.log(file);
    cloudinary.uploader.upload(file.tempFilePath, (err,result) => {
        if (err) {
            console.log(err);
            res.send("Some Went Wrong!!")
        }else {
            // var mainImage = db.run("select * from glassArtImages where type = 'main'");
            db.get("select * from glassArtImages where type = 'main'",(err,mainImage) => {
                if (err) throw err;
                // console.log(mainImage);
                if (!mainImage) {
                    db.run(`insert into glassArtImages (url, type, public_id) values('${result.url}', "main", '${result.public_id}')`);
                }else {
                    db.run(`update glassArtImages set url='${result.url}', public_id='${result.public_id}' where type='main'`);
                    console.log(result);
                }
                res.redirect('/admin/glassArt');
            });
            
        }
    })
    // res.send("hello worldj");
})

app.post("/glassArt/upload", (req,res) => {
    if (!req.files) {
        res.send("Images not Found!!");
    }
    files = req.files.glassArtMainImage;
    var loop = false;
    var loopCount = 0;
    for (const file of files) {
        cloudinary.uploader.upload(file.tempFilePath, (err,result) => {
            if (err) throw err;
            db.run(`insert into glassArtImages (url, type, public_id) values('${result.url}', "inner", '${result.public_id}')`);
            loopCount = loopCount + 1;
            if (loopCount == files.length) {
                console.log(loopCount + " This is Equal to "+ files.length);
                res.redirect("/admin/glassArt");
            }
        });
    }
    // res.send('Some Went Wrong!!');
})

app.get('/glassArt/delete/:public_id', (req, res) => {
    var public_id = req.params.public_id;
    cloudinary.uploader.destroy(public_id, (err,result) => {
        if (err) throw err;
        console.log("cloudinary Result", result);
        db.run(`DELETE from glassArtImages where public_id = ?`, public_id, (err, result) => {
            if (err) throw err;
            res.redirect("/admin/glassArt")
        })
    })
})



app.listen(port, () => {
    console.log('server started on http://localhost:3000');
})


