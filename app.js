require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to your To Do List."
});

const item2 = new Item ({
  name: "Click the + to add a list item."
});

const item3 = new Item ({
  name: "Check the item's checkbox to remove the item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

const day = date.getDate();
const year = date.getYear();



app.get("/", function(req, res) {

  Item.find({}, function(err, items) {
    if (items.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Default items added.");
        }
        res.redirect("/");
      });
    } else {
      res.render("list", {listTitle: day, newListItems: items, year: year});
    }
  });
});

app.get("/:page", function(req,res){
  const requestedPage = _.capitalize(req.params.page);

  List.findOne({name: requestedPage}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // create new list
        const newList = new List ({
          name: requestedPage,
          items: defaultItems
        });
        newList.save();
        res.redirect("/" + requestedPage);
      } else {
        // show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items, year: year})
      }
    }
  });
});




app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item ({
    name: itemName
  });

  if (listName === day) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === day) {
    Item.findByIdAndRemove({_id: checkedItemId}, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Item was deleted.");
      }
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      //What are you finding?
      {name: listName},
      //What do you want to update? $pull to remove by ID
      {$pull: {items: {_id: checkedItemId}}},
      function(err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      });
    }
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log(`Server has started on port ${port}.`);
});
