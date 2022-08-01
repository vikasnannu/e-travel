import React, { Fragment, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PlaceList from '../components/PlaceList';
import { useHttpClient } from '../../shared/hooks/http-hook';
import ErrorModal from '../../shared/components/UIElements/ErrorModal';
import LoadingSpinner from '../../shared/components/UIElements/LoadingSpinner';

const UserPlaces = () => {

    const [loadedPlaces, setLoadedPlaces] = useState();
    const { isLoading, error, sendRequest, clearError } = useHttpClient();
    const userId = useParams().userId;
    
    const urlUserId= `https://e-travel-vikasnannu.herokuapp.com/api/places/user/${userId}`;

    useEffect(() => {
        const fetchPlaces = async () => {
            try {
                const responseData = await sendRequest(urlUserId);
                setLoadedPlaces(responseData.places);
            }
            catch (err) {
                console.log(err.message);
            }
        }

        fetchPlaces();
    }, [sendRequest, userId]);

    const placeDeleteHandler = (deletedPlaceId) => {
        setLoadedPlaces(prevPlaces => prevPlaces.filter(place => place.id !== deletedPlaceId));
    };

    return (
        <Fragment>
        <ErrorModal error={error} onClear={clearError} />
        {isLoading && <div className='center'><LoadingSpinner /></div>}
        {!isLoading && loadedPlaces && <PlaceList items={loadedPlaces} onDeletePlace={placeDeleteHandler} />}
        </Fragment>
    );
};

export default UserPlaces;