const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res, next) {
    res.json({ data: orders });
}

function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        
        if (data[propertyName]) {
            return next();
        }
        next({
            status: 400,
            message: `Order must include a ${propertyName}`
        });
    };
}

function deliverToIsValid(req, res, next) {
    const { data: { deliverTo } = {} } = req.body;
    
    if (typeof deliverTo === "string" && deliverTo.length > 0) {
        return next();
    }
    next({
        status: 400,
        message: `Order must include a deliverTo`,
    })
}

function mobileNumberIsValid(req, res, next) {
    const { data: { mobileNumber } = {} } = req.body;
    
    if (typeof mobileNumber === "string" && mobileNumber.length > 0) {
        return next();
    }
    next({
        status: 400,
        message: `Order must include a mobileNumber`,
    })
}

function dishesIsValid(req, res, next) {
    const { data: { dishes } = {} } = req.body;

    // check if dishes property is missing
    if (!dishes) {
        next({
            status: 400, 
            message: `Order must include a dish`,
        })
    }

    // check if dishes property is empty
    if (dishes.length <= 0) {
        return next({
            status: 400,
            message: `Order must include at least one dish`,
        });
    }
    
    // check if dishes is an array
    if (!Array.isArray(dishes)) {
        next({
            status: 400, 
            message: `Order must include a dish`,
        })
    }

    let index = 0;
    for (const dish of dishes) {
        // check if quantity is valid
        if (dish.quantity === undefined || dish.quantity <= 0 || !Number.isInteger(dish.quantity)) {
            next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`
            });
        }
        ++index;
    }   
    next();
}

function create(req, res, next) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        status: status,
        dishes: [...dishes],
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId.toString());
    
    if (foundOrder) {
        res.locals.foundOrder = foundOrder;
        return next();
    }
    next({
        status: 404, 
        message: `Order does not exist: ${orderId}`,
    });
}

function statusIsValid(status) {
    const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
    return validStatus.includes(status);
}

function read(req, res, next) {
    const foundOrder = res.locals.foundOrder;
    
    res.json( { data: foundOrder });
}

function update(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = res.locals.foundOrder;
    const { data: { deliverTo, mobileNumber, status, dishes, id } = {} } = req.body;

    // orderId does not exist
    if (!foundOrder) {
        return next({
            status: 404,
            message: `Order does not exist: ${orderId}`,
        });
    }

    // check if id === route orderId
    if (id && id !== orderId) {
        return next({
            status: 400, 
            message: `Order does not match route id. Order: ${id}, Route: ${orderId}.`
        });
    }

    // check if status is valid 
    if (!statusIsValid(status)) {
        return next({
            status: 400,
            message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
        });
    }

    if (status === "delivered") {
        return next({
            status: 400, 
            message: `A delivered order cannot be changed`,
        });
    }

    foundOrder.deliverTo = deliverTo;
    foundOrder.mobileNumber = mobileNumber;
    foundOrder.status = status;
    foundOrder.dishes = dishes;

    res.json( { data: foundOrder });
    return;
}

function destroy(req, res, next) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId.toString());

    // order is found
    if (index > -1 ) {
        if (orders[index].status !== "pending") {
            return next({
                status: 400, 
                message: `An order cannot be deleted unless it is pending`,
            });
        }
        else {
            const deletedOrder = orders.splice(index, 1);
            return res.sendStatus(204);
        }
    }
    next({
        status: 404, 
        message: `No order found ${orderId}`,
    });
}

module.exports = {
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        deliverToIsValid,
        mobileNumberIsValid,
        dishesIsValid,
        create
    ],
    list,
    read: [orderExists, read],
    update: [
        orderExists,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        deliverToIsValid,
        mobileNumberIsValid,
        dishesIsValid,
        update,
    ],
    delete: destroy,
}