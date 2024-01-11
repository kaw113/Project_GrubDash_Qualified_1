const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res, next) {
    res.json({ data: dishes });
}

function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        
        if (data[propertyName]) {
            return next();
        }
        next({
            status: 400,
            message: `Dish must include a ${propertyName}`
        });
    };
}

function nameIsValid(req, res, next) {
    const { data: { name } = {} } = req.body;
   
    if (typeof name === "string" && name.length > 0) {
        return next();
    }
    next({
        status: 400,
        message: `Dish must include a name`,
    })
}

function descriptionIsValid(req, res, next) {
    const { data: { description } = {} } = req.body;
    
    if (typeof description === "string" && description.length > 0) {
        return next();
    }
    next({
        status: 400,
        message: `Dish must include a description`,
    })
}

function priceIsValid(req, res, next) {
    const { data: { price } = {} } = req.body;
    
    if (price === undefined || typeof price !== "number" || price <= 0 || !Number.isInteger(price)) {
        return next({
            status: 400,
            message: `Dish must have a price that is an integer greater than 0`
        })
    }
    next();
}

function imageUrlIsValid(req, res, next) {
    const { data: { image_url } = {} } = req.body;

    if (typeof image_url === "string" && image_url.length > 0) {
        return next();
    }
    next({
        status: 400,
        message: `Dish must include a image_url`,
    })
}

function create(req, res, next) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name: name,
        description: description,
        price: price, 
        image_url: image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId.toString());

    if (foundDish) {
        res.locals.foundDish = foundDish;
        return next();
    }
    next({
        status: 404, 
        message: `Dish does not exist: ${dishId}`,
    });
}

function read(req, res, next) {
    const foundDish = res.locals.foundDish;

    res.json({ data: foundDish} );
}

function update(req, res, next) {
    const { dishId } = req.params;
    const foundDish = res.locals.foundDish;

    const { data: { name, description, price, image_url, id } = {} } = req.body;
    
    // check if id === route dishId 
    if (id && id !== dishId) {
        return next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
        });
        
    }

    foundDish.name = name;
    foundDish.description = description;
    foundDish.price = price;
    foundDish.image_url = image_url;

    res.json({ data: foundDish }); 
    return;
}

module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        nameIsValid,
        descriptionIsValid,
        priceIsValid,
        imageUrlIsValid,
        create,
    ],
    list,
    read: [dishExists, read],
    update: [
        dishExists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        nameIsValid,
        descriptionIsValid,
        priceIsValid,
        imageUrlIsValid,
        update, 
    ],
};