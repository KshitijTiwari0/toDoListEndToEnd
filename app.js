//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const { default: mongoose } = require("mongoose");

const app = express();

const _ = require("lodash");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB",{useNewUrlParser: true});


const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Welcome to your todoList!"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3]; // Fixed the duplicate item2

const listSchema = {
  name:String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema); 

app.get("/", function(req, res) {
  Item.find({})
    .then(foundItems => {
      if (foundItems.length === 0){
       Item.insertMany(defaultItems);
       res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });

      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("Internal Server Error");
    });
});

// ... (previous code) ...

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(foundList => {
      if (foundList) {
        // Do something if the list exists
        // For example, render a page with the list items
        // res.render("customList", { listTitle: customListName, newListItems: foundList.items });
        res.render("list",{listTitle:foundList.name,newListItems:foundList.items});
      } else {
        console.log("Not Exists");
        // Do something if the list does not exist
        // For example, create a new list and save it to the database
        const list = new List({ name: customListName, items: defaultItems });
        list.save();
      }
    })
    .catch(err => {
      console.error(err);
      // Handle the error
      res.status(500).send("Internal Server Error");
    });
});


// ... (remaining code) ...


app.post("/", async function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  try {
    if (listName === "Today") {
      await item.save();
      res.redirect("/");
    } else {
      const foundList = await List.findOne({ name: listName });
      if (foundList) {
        foundList.items.push(item);
        await foundList.save();
      } else {
        const newList = new List({ name: listName, items: [item] });
        await newList.save();
      }
      res.redirect("/" + listName);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/delete", function(req, res) {
  const deleteItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    if (deleteItemId) {
      Item.findByIdAndRemove(deleteItemId)
        .then(() => {
          res.redirect("/");
        })
        .catch(err => {
          console.error(err);
          res.status(500).send("Internal Server Error");
        });
    } else {
      res.redirect("/");
    }
  } else {
    if(listName) {
      List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: deleteItemId } } })
        .then(() => {
          res.redirect("/" + listName);
        })
        .catch(err => {
          console.error(err);
          res.status(500).send("Internal Server Error");
        });
    } else {
      res.redirect("/");
    }
  }
});

app.get("/work", function(req, res){
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
