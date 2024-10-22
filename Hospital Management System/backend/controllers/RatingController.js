const Ratingg = require('../models/Rating');
const Staff = require('../models/Staff');

const getStaffByEmail = async (email) => {
    try {
        const staff = await Staff.findOne({
            where: { Email: email }
        });

        if (!staff) {
            throw new Error('Staff not found');
        }

        return staff;
    } catch (error) {
        console.error('Error fetching staff by email:', error);
        throw error;
    }
};

const FindAllRating = async (req, res) => {
    try {
        const userEmail = req.user.email;  // Get the logged-in user's email
        const userRole = req.user.role;     // Get the logged-in user's role

        let ratings;
        if (userRole === 'admin') {
            // Admin can see all ratings
            ratings = await Ratingg.findAll({
                include: {
                    model: Staff, // Include staff details
                },
            });
        } else if (userRole === 'doctor') {
            // Fetch ratings for the logged-in staff member
            const staff = await getStaffByEmail(userEmail);
            ratings = await Ratingg.findAll({
                where: { Emp_ID: staff.Emp_ID }, // Filter by Emp_ID
                include: {
                    model: Staff, // Include staff details
                },
            });
        } else {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const ratingsDataWithStaffNames = ratings.map(rating => ({
            ...rating.toJSON(),
            Staff_Name: rating.Staff ? `${rating.Staff.Staff_Fname} ${rating.Staff.Staff_Lname}` : 'Unknown Staff'
        }));

        res.json(ratingsDataWithStaffNames);
    } catch (error) {
        console.error('Error fetching all ratings:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    FindAllRating,
    getStaffByEmail,
};

const FindSingleRating = async (req, res) => {
    try {
        const rating = await Ratingg.findByPk(req.params.id);
        if (!rating) {
            res.status(404).json({ error: 'Rating not found' });
            return;
        }
        res.json(rating);
    } catch (error) {
        console.error('Error fetching single rating:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const AddRating = async (req, res) => {
    try {
        const { Emp_ID, Rating, Comments, Date } = req.body;

        // Validation
        if (!Emp_ID || !Rating || !Comments || !Date) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (Emp_ID < 1) {
            return res.status(400).json({ error: 'Staff ID cannot be less than 1' });
        }
        if (Comments.length > 30) {
            return res.status(400).json({ error: 'Comments must be maximum 30 characters long' });
        }

        // Check if a rating already exists for the employee
        const existingRating = await Ratingg.findOne({ where: { Emp_ID } });
        if (existingRating) {
            // If the employee already has a rating, return an error
            return res.status(400).json({ error: `Employee ${Emp_ID} has already been rated` });
        }

        // Assuming Ratingg is the Sequelize model for your Rating table
        const newRating = await Ratingg.create({
            Emp_ID,
            Rating,
            Comments,
            Date,
        });
        res.json({ success: true, message: 'Rating added successfully', data: newRating });
    } catch (error) {
        console.error('Error adding rating:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const UpdateRating = async (req, res) => {
    try {
        const { Emp_ID, Rating, Comments, Date } = req.body;

        // Validation
        if (!Emp_ID || !Rating || !Comments || !Date) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (Emp_ID < 1) {
            return res.status(400).json({ error: 'Staff ID cannot be less than 1' });
        }
        if (Comments.length > 30) {
            return res.status(400).json({ error: 'Comments must be maximum 30 characters long' });
        }

        // Check if the employee has already been rated
        const existingRating = await Ratingg.findOne({ where: { Emp_ID } });
        if (existingRating && existingRating.Rating_ID !== parseInt(req.params.id)) {
            return res.status(400).json({ error: `Employee ${Emp_ID} has already been rated` });
        }

        const updated = await Ratingg.update(
            { Emp_ID, Rating, Comments, Date },
            { where: { Rating_ID: req.params.id } }
        );
        if (updated[0] === 0) {
            return res.status(404).json({ error: 'Rating not found or not updated' });
        }
        res.json({ success: true, message: 'Rating updated successfully' });
    } catch (error) {
        console.error('Error updating rating:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const DeleteRating = async (req, res) => {
    try {
        const deleted = await Ratingg.destroy({
            where: { Rating_ID: req.params.id },
        });
        if (deleted === 0) {
            res.status(404).json({ error: 'Rating not found' });
            return;
        }
        res.json({ success: true, message: 'Rating deleted successfully' });
    } catch (error) {
        console.error('Error deleting insurance:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    FindAllRating,
    FindSingleRating,
    AddRating,
    UpdateRating,
    DeleteRating,
};
