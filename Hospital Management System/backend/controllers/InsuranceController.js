const Insurance = require('../models/Insurance');
const { Op, Sequelize } = require('sequelize'); //
const Patient = require('../models/Patient');
const getPatientByEmail = async (email) => {
    try {
        const patient = await Patient.findOne({
            where: { Email: email }
        });

        if (!patient) {
            throw new Error('Patient not found');
        }

        return patient;
    } catch (error) {
        console.error('Error fetching patient by email:', error);
        throw error;
    }
};
const FindAllInsurance = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const userRole = req.user.role;

        let insurances;
        if (userRole === 'admin') {
            insurances = await Insurance.findAll({
                include: {
                    model: Patient // Include the Patient model to get patient details
                },
            });
        } else if (userRole === 'patient') {
            const patient = await getPatientByEmail(userEmail);
            insurances = await Insurance.findAll({
                where: { Patient_ID: patient.Patient_ID },
                include: {
                    model: Patient // Include the Patient model for the specific patient
                },
            });
        } else {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const insurancesDataWithNames = insurances.map(insurance => ({
            ...insurance.toJSON(),
            Patient_Name: insurance.Patient ? `${insurance.Patient.Patient_Fname} ${insurance.Patient.Patient_Lname}` : 'Unknown Patient'
        }));

        res.json(insurancesDataWithNames);
    } catch (error) {
        console.error('Error fetching all insurance:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const FindSingleInsurance = async (req, res) => {
    try {
        const insurance = await Insurance.findByPk(req.params.id);
        if (!insurance) {
            res.status(404).json({ error: 'Insurance not found' });
            return;
        }
        res.json(insurance);
    } catch (error) {
        console.error('Error fetching single insurance:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const AddInsurance = async (req, res) => {
    try {
        const { Patient_ID, Ins_Code, End_Date, Provider, Dental } = req.body;

        // Validate input fields
        if (!Ins_Code) {
            return res.status(400).json({ error: 'Ins_Code cannot be empty' });
        }
        const insCodeStr = Ins_Code.toString();
        if (insCodeStr.length !== 7) {
            return res.status(400).json({ error: 'Ins_Code must be 7 characters long' });
        }
        if (!End_Date) {
            return res.status(400).json({ error: 'End_Date cannot be empty' });
        }
        if (insCodeStr.startsWith('0')) {
            return res.status(400).json({ error: 'Please remove the leading 0 from the Ins_Code.' });
        }
        if (new Date(End_Date) < new Date(new Date().setHours(0, 0, 0, 0))) {
            return res.status(400).json({ error: 'End_Date cannot be in the past' });
        }
        if (!Provider) {
            return res.status(400).json({ error: 'Provider cannot be empty' });
        }

        // Check if the insurance code is already used by any patient except the current one
        const existingInsuranceWithCode = await Insurance.findOne({ where: { Ins_Code } });
        if (existingInsuranceWithCode && existingInsuranceWithCode.Patient_ID !== Patient_ID) {
            return res.status(400).json({ error: 'This insurance code is already in use by another patient.' });
        }

        // Create new insurance record
        const newInsurance = await Insurance.create({
            Patient_ID,
            Ins_Code,
            End_Date,
            Provider,
            Dental,
        });

        res.json({ success: true, message: 'Insurance added successfully', data: newInsurance });
    } catch (error) {
        console.error('Error adding insurance:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const UpdateInsurance = async (req, res) => {
    try {
        const { Patient_ID, Ins_Code, End_Date, Provider, Dental } = req.body;

        // Validation
        if (!Ins_Code) {
            return res.status(400).json({ error: 'Ins_Code cannot be empty' });
        }
        const insCodeStr = Ins_Code.toString();
        if (insCodeStr.length !== 7) {
            return res.status(400).json({ error: 'Ins_Code must be 7 characters long' });
        }
        if (!End_Date) {
            return res.status(400).json({ error: 'End_Date cannot be empty' });
        }
        if (insCodeStr.startsWith('0')) {
            return res.status(400).json({ error: 'Please remove the leading 0 from the Ins_Code.' });
        }
        if (new Date(End_Date) < new Date(new Date().setHours(0, 0, 0, 0))) {
            return res.status(400).json({ error: 'End_Date cannot be in the past' });
        }
        if (!Provider) {
            return res.status(400).json({ error: 'Provider cannot be empty' });
        }

        // Check if this patient already has an insurance record excluding the current one being updated
        // const existingInsuranceForPatient = await Insurance.findOne({
        //     where: {
        //         Patient_ID,
        //         Policy_Number: { [Op.ne]: req.params.id } // Exclude the current insurance being updated
        //     }
        // });

        // // If the patient already has insurance, prevent update
        // if (existingInsuranceForPatient) {
        //     return res.status(400).json({ error: 'This patient already has an insurance record.' });
        // }

        // Check if the Ins_Code is already in use by another insurance record (excluding the current one)
        const existingInsuranceWithCode = await Insurance.findOne({
            where: {
                Ins_Code,
                Policy_Number: { [Op.ne]: req.params.id } // Exclude the current insurance being updated
            }
        });

        // If the insurance code is already used by another record, prevent update
        if (existingInsuranceWithCode) {
            return res.status(400).json({ error: 'This insurance code is already in use by another record.' });
        }

        // Proceed with the update since no conflicting insurance exists
        const updated = await Insurance.update(
            { Patient_ID, Ins_Code, End_Date, Provider, Dental },
            { where: { Policy_Number: req.params.id } }
        );

        if (updated[0] === 0) {
            return res.status(404).json({ error: 'Insurance not found or not updated' });
        }
        res.json({ success: true, message: 'Insurance updated successfully' });
    } catch (error) {
        console.error('Error updating insurance:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




const DeleteInsurance = async (req, res) => {
    try {
        const deleted = await Insurance.destroy({
            where: { Policy_Number: req.params.id },
        });
        if (deleted === 0) {
            return res.status(404).json({ error: 'Insurance not found' });
        }
        res.json({ success: true, message: 'Insurance deleted successfully' });
    } catch (error) {
        console.error('Error deleting insurance:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    FindAllInsurance,
    FindSingleInsurance,
    AddInsurance,
    UpdateInsurance,
    DeleteInsurance,
};
