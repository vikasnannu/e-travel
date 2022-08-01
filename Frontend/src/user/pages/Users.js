import React, { Fragment, useEffect, useState } from 'react';

import UsersList from '../components/UsersList';
import ErrorModal from '../../shared/components/UIElements/ErrorModal';
import LoadingSpinner from '../../shared/components/UIElements/LoadingSpinner';
import { useHttpClient } from '../../shared/hooks/http-hook';

const Users = () => {

    const { isLoading, error, sendRequest, clearError } = useHttpClient();
    const [loadedUser, setLoadedUser] = useState();

    useEffect(() => {

        const urlUsers = 'https://e-travel-vikasnannu.herokuapp.com/api/users';

        const fetchUsers = async () => {
            try {
                const responseData = await sendRequest(urlUsers);
                setLoadedUser(responseData.users);
            } catch (err) {
                console.log(err.message);
            }
        }

        fetchUsers();

    }, [sendRequest]);


    return (
        <Fragment>
            <ErrorModal error={error} onClear={clearError} />
            {isLoading && (<div className='center'><LoadingSpinner /></div>)}
            {!isLoading && loadedUser && <UsersList items={loadedUser} />}
        </Fragment>
    );
};

export default Users;