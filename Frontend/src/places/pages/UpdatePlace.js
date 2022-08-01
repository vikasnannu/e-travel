import React, { Fragment, useEffect, useState, useContext } from 'react';
import { useParams, useHistory } from 'react-router-dom';

import Input from '../../shared/components/FormElements/Input';
import Button from '../../shared/components/FormElements/Button';
import Card from '../../shared/components/UIElements/Card';
import { VALIDATOR_REQUIRE, VALIDATOR_MINLENGTH} from '../../shared/util/Validators';
import { useForm } from '../../shared/hooks/form-hook';
import './PlaceForm.css';

import { useHttpClient } from '../../shared/hooks/http-hook';
import { AuthContext } from '../../shared/context/auth-context';
import ErrorModal from '../../shared/components/UIElements/ErrorModal';
import LoadingSpinner from '../../shared/components/UIElements/LoadingSpinner';


const UpdatePlace = () => {
    
    const { isLoading, error, sendRequest, clearError } = useHttpClient();
    const [loadedPlace, setLoadedPlace] = useState();
    const history = useHistory();
    const auth = useContext(AuthContext);

    const placeId = useParams().placeId;

    const [formState, inputHandler, setFormData] = useForm({
        title: {
            value: '',
            isValid: false
          },
          description: {
            value: '',
            isValid: false
          },
    }, false);

    useEffect(() => {
        
        const urlUserId= `https://e-travel-vikasnannu.herokuapp.com/api/places/${placeId}`;
        const fetchPlaces = async () => {
            try {
                const responseData = await sendRequest(urlUserId);
                setLoadedPlace(responseData.place);
                setFormData({
                    title: {
                        value: responseData.place.title,
                        isValid: true
                    },
                    description: {
                        value: responseData.place.description,
                        isValid: true
                    },
                }, true);
            }
            catch (err) {
                console.log(err.message);
            }
        }

        fetchPlaces();
    }, [sendRequest, placeId, setFormData]);
    

    const placeUpdatedSubmitHandler = async event => {
        event.preventDefault();
        
        const urlUpdate= `https://e-travel-vikasnannu.herokuapp.com/api/places/${placeId}`;
        const body = JSON.stringify({ title: formState.inputs.title.value, description: formState.inputs.description.value});
        const headers = {'Content-Type': 'application/json', Authorization: 'Bearer ' + auth.token};

        try {
            await sendRequest(urlUpdate, 'PATCH', body, headers);
            history.push('/' + auth.userId + '/places');
        }
        catch (err) {
            console.log(err.message);
        }
        
    };

    if(isLoading) {
        return (
            <div className='center'>
                <LoadingSpinner />
            </div>
        );
    }

    if(!loadedPlace && !error) {
        return <div className='center'>
                    <Card><h2>Could not find place</h2></Card>   
                </div>
    }

    return (
        <Fragment>
            <ErrorModal error={error} onClear={clearError} />
            {!isLoading && loadedPlace && <form className='place-form' onSubmit={placeUpdatedSubmitHandler}>
                <Input 
                    id="title" 
                    element="input" 
                    type="text" 
                    label="Title" 
                    validators={[VALIDATOR_REQUIRE()]} 
                    errorText="Please enter a valid title" 
                    onInput={inputHandler} 
                    initialValue={loadedPlace.title} 
                    initialValid={true}  /> 
                <Input 
                    id="description" 
                    element="textarea" 
                    type="text" 
                    label="Description" 
                    validators={[VALIDATOR_MINLENGTH(5)]} 
                    errorText="Please enter a valid description" 
                    onInput={inputHandler} 
                    initialValue={loadedPlace.description} 
                    initialValid={true}  /> 

                <Button type="submit" disabled={!formState.isValid}>UPDATE PLACE</Button>
            </form> }
        </Fragment>
    );
};

export default UpdatePlace;