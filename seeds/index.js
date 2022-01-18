const mongoose = require('mongoose')
const Campground = require('../models/campground')
const cities = require('./cities')
const { places, descriptors } = require('./seedHelpers')

// app.set('view engine', 'ejs')ws', path.join(__dirname, "views"))

const sample = array => array[Math.floor(Math.random() * array.length)]


main().catch(err => console.log(err));

async function main() {
    try {
        await mongoose.connect('mongodb://localhost:27017/YelpCamp');
        console.log('mongoose connected')
    }
    catch (e) {
        console.log('oh no,,mongoose error')
        console.log(e)
    }
}

const seedDB = async () => {
    await Campground.deleteMany({})
    for (let i = 0; i < 300; i++) {
        const random1000 = Math.floor(Math.random() * 1000) + 1
        const price = Math.floor(Math.random() * 20) + 10
        const camp = new Campground({
            author: '61de69ee11a5af3f95f28348',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            geometry: {
                type: 'Point',
                coordinates: [cities[random1000].longitude, cities[random1000].latitude]
            },
            images: [
                {
                    url: 'https://res.cloudinary.com/dvtnb1kck/image/upload/v1642094722/YelpCamp/tn3cnngswcl0vpykoxzl.jpg',
                    filename: 'YelpCamp/tn3cnngswcl0vpykoxzl',

                },
                {
                    url: 'https://res.cloudinary.com/dvtnb1kck/image/upload/v1642094722/YelpCamp/vlfihvkawahadnspez0g.jpg',
                    filename: 'YelpCamp/vlfihvkawahadnspez0g',

                }
            ],
            description: 'Lorem ipsum, dolor sit amet consectetur adipisicing elit. Debitis suscipit, assumenda fugit doloremque harum cumque perferendis dolorem ipsa nihil vitae error nulla aut incidunt accusamus, nostrum a expedita repellendus libero?',
            price
        })
        await camp.save()
    }
}

seedDB().then(() => {
    mongoose.connection.close()
})

