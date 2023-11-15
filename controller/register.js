const express = require('express');
const fs = require('fs');
const AWS = require('aws-sdk');
require('dotenv').config();


const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY

const s3 = new AWS.S3({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    region: region
});

const register =  (req, res, next) => {
    // extracct user registration details
    const { teamName, teamMembers, teamLeaderName,
        college, branch, rollNumber, email, mobileNumber,
        team_member_1, team_member_1_roll_no, team_member_1_gender,
        team_member_2, team_member_2_roll_no, team_member_2_gender,
        team_member_3, team_member_3_roll_no, team_member_3_gender,
        team_member_4, team_member_4_roll_no, team_member_4_gender,
        team_member_5, team_member_5_roll_no, team_member_5_gender,
        track,
    } 
    = req.body.fields
    const file = req.body.file

    const upload_file = (file) => {
        const fileStream = fs.createReadStream(file.path);

        const params = {
            Bucket: bucketName,
            Key: file.originalname,
            Body: fileStream,
        };
        console.log(`this is params data with bucket name ${bucketName} \t`, params)
        s3.upload(params, function (err, data) {
            if (err) {
                throw err
            }
            else {
                console.log(`File uploaded successfully. ${data.Location}`);

                return res.json({ file_path: data.Location });
            }
        });

    }

    register_user = async (user) => {
        try {
            const newRegistration = new Registration(user);
        
            const savedRegistration = await newRegistration.save();
            res.status(201).json(savedRegistration);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }
    upload_file(file, function (err, path) {
        if (err) {
            console.log(err);
            throw err
            
        }
        else {
            console.log(`File uploaded successfully. ${path}`);
        // create new user 
        const new_user = {
            teamName:teamName, teamMembers:teamMembers, teamLeaderName:teamLeaderName,
            college:college, branch:branch, rollNumber:rollNumber, email:email, mobileNumber:mobileNumber,
            team_member_1:team_member_1, team_member_1_roll_no:team_member_1_roll_no, team_member_1_gender:team_member_1_gender,
            team_member_2:team_member_2, team_member_2_roll_no:team_member_2_roll_no, team_member_2_gender:team_member_2_gender,
            team_member_3:team_member_3, team_member_3_roll_no:team_member_3_roll_no, team_member_3_gender:team_member_3_gender,
            team_member_4:team_member_4, team_member_4_roll_no:team_member_4_roll_no, team_member_4_gender:team_member_4_gender,
            team_member_5:team_member_5, team_member_5_roll_no:team_member_5_roll_no, team_member_5_gender:team_member_5_gender,
            track:track, file_path:path
            }

        register_user(new_user)
            

        }
    });

   
}

exports.register = register
