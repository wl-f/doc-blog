import {useEffect, useState} from "react";

const useKeyPress = (targetKeyCode) =>{
    const [keyPressed,setKeyPressed] = useState(false);

    const keyupEvent = (event) =>{
        // console.log('keydownEvent',event)
        if (event.keyCode===targetKeyCode){
            setKeyPressed(false)
        }
    };
    const keydownEvent = (event) =>{
        // console.log('keydownEvent',event)
        if (event.keyCode===targetKeyCode){
            setKeyPressed(true)
        }
    };
    useEffect(()=>{
        document.addEventListener('keyup',keyupEvent);
        document.addEventListener('keydown', keydownEvent);
        return ()=>{
            document.removeEventListener('keyup',keyupEvent);
            document.removeEventListener('keydown', keydownEvent);

        }
    },[]);

    return keyPressed
};

export default useKeyPress
