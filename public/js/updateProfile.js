import axios from "axios";
import { showAlert } from "./alerts";

// type is either 'password' or 'data'
export const updateUserData = async (data, type) => {
    try {
        const url = type === 'password'
            ? '/api/v1/users/change-my-password'
            : '/api/v1/users/update-my-details';

        const res = await axios({
            method: 'PATCH',
            url,
            data
        });

        if (res.data.statusCode === '00') {
            showAlert('success', `${type.toUpperCase()} updated successfully`)
        }

    } catch (err) {
        showAlert('error', err.response.data.statusMessage)
    }
};