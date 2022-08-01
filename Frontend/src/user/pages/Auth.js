import React, { Fragment, useState, useContext } from 'react';

import Card from '../../shared/components/UIElements/Card';
import Input from '../../shared/components/FormElements/Input';
import Button from '../../shared/components/FormElements/Button';
import ErrorModal from '../../shared/components/UIElements/ErrorModal';
import LoadingSpinner from '../../shared/components/UIElements/LoadingSpinner';
import ImageUpload from '../../shared/components/FormElements/ImageUpload';
import { useForm } from '../../shared/hooks/form-hook';
import { AuthContext } from '../../shared/context/auth-context';
import { useHttpClient } from '../../shared/hooks/http-hook';
import { VALIDATOR_EMAIL, VALIDATOR_MINLENGTH, VALIDATOR_REQUIRE } from '../../shared/util/Validators';


import './Auth.css';

const Auth = () => {

    const auth = useContext(AuthContext);

    const [isLoginMode, setIsLoginMode] = useState(true);

    const { isLoading, error, sendRequest, clearError } = useHttpClient();

    const [formState, inputHandler, setFormData] = useForm({
        email: {
            value: '',
            isValid: false
        },
        password: {
            value: '',
            isValid: false
        },
    }, false);

    const switchModeHandler = () => {
        
        if(!isLoginMode) {
            setFormData({
                ...formState.inputs,
                name: undefined,
                image: undefined
            }, formState.inputs.email.isValid && formState.inputs.password.isValid);
        }
        else {
            setFormData({
                ...formState.inputs,
                name: {
                    value: '',
                    isValid: false
                },
                image: {
                    value: null,
                    isValid: false
                }
            }, false);
        }
        setIsLoginMode(prevMode => !prevMode);
    };

    const authSubmitHandler = async event => {
        event.preventDefault();
        console.log(formState.inputs);

        const urlLogin = 'https://e-travel-vikasnannu.herokuapp.com/api/users/login';
        const urlSignup = 'https://e-travel-vikasnannu.herokuapp.com/api/users/signup';
        const headers = {'Content-Type': 'application/json'};

        if(isLoginMode) {
            try {
                const responseData = await sendRequest(urlLogin, 'POST', JSON.stringify({ email: formState.inputs.email.value, password: formState.inputs.password.value}), headers);
                auth.login(responseData.userId, responseData.token);
            }
            catch (err) {
                console.log(err.message);
            }
            
        } 
        else {
            try {
                const formData = new FormData();
                formData.append('name', formState.inputs.name.value);
                formData.append('email', formState.inputs.email.value);
                formData.append('password', formState.inputs.password.value);
                formData.append('image', formState.inputs.image.value);

                const responseData = await sendRequest(urlSignup, 'POST', formData);
                auth.login(responseData.userId, responseData.token);
            } 
            catch (err) {
                console.log(err.message);
            }
            
        }
        
    };

    return (
        <Fragment>
        <Card className="authentication">
        {<ErrorModal error={error} onClear={clearError} />}
        {isLoading && <LoadingSpinner asOverlay/>}
            <h2>Login Required</h2>
            <form onSubmit={authSubmitHandler}>
                {!isLoginMode && <Input 
                                        element="input" 
                                        id="name" 
                                        type="text" 
                                        label="Your Name" 
                                        validators={[VALIDATOR_REQUIRE()]}
                                        errorText="Please enter a name."
                                        onInput={inputHandler} />}
                {!isLoginMode && <ImageUpload center id="image" onInput={inputHandler} errorText="Please provide an iamge" />}
                <Input 
                    element="input" 
                    id="email" 
                    type="email" 
                    label="E-Mail" 
                    validators={[VALIDATOR_EMAIL()]}
                    errorText="Please enter a valid email address"
                    onInput={inputHandler} />
                <Input 
                    element="input" 
                    id="password" 
                    type="password" 
                    label="Password" 
                    validators={[VALIDATOR_MINLENGTH(6)]}
                    errorText="Please enter a valid password, atleast 6 char"
                    onInput={inputHandler} />
                <Button type="submit" disabled={!formState.isValid}>{isLoginMode ? 'LOGIN' : 'SIGNUP'}</Button>
                </form>
                <Button inverse onClick={switchModeHandler}>SWITCH TO {isLoginMode ? 'SIGNUP' : 'LOGIN'}</Button>
            
        </Card>
        </Fragment>
    );
};

export default Auth;