import React, {useEffect, useRef, useState} from "react";
import PropTypes from 'prop-types'
import useKeyPress from "../hooks/useKeyPress";
import useIpcRenderer from '../hooks/useIpcRenderer'

const FileSearch = ({onFileSearch}) =>{
    // console.log(onFileSearch);
    const [isActive,setIsActive] = useState(false); // 受控变量,是否激活搜索框
    const [value,setValue] = useState(''); // input value



    let inputRef = useRef(null); // useRef hook
    const enterPressed = useKeyPress(13);
    const escPressed = useKeyPress(27);

    const startSearch = () => {
        setIsActive(true)
    }


    const closeSearch = () => {
        setIsActive(false)
        setValue('');
        // onFileSearch('')
        onFileSearch(false)
    }

    // input框激活时focus
    useEffect(()=>{
        if (isActive){
            inputRef.current.focus()
        }
    });

    // 键盘对输入框控制 enter键搜索 esc键退出
    useEffect(() => {
        if (enterPressed && isActive) {
            onFileSearch(value)
        }
        if(escPressed && isActive) {
            closeSearch()
        }
    });

    useIpcRenderer({
        'search-file': startSearch
    })


    return(
        <div className="alert alert-primary">
            {
                isActive && <div className="row">
                    <input
                        ref={inputRef}
                        className="form-control col-8"
                        value={value}
                        onChange={(e) => { setValue(e.target.value) }}
                    />
                    <button
                        type="button"
                        className="btn btn-primary col-4"
                        onClick={closeSearch}
                    >
                        关闭
                    </button>
                </div>
            }
            {
                !isActive &&<div className="d-flex justify-content-between align-items-center">
                <span>我的文档</span>
                <button
                type="button"
                className="btn btn-primary"
                // onClick={() => { setIsActive(true) }}
                onClick={startSearch}
                >
                搜索
                </button>
                </div>
            }

        </div>
    )
};
FileSearch.propTypes={
    onFileSearch:PropTypes.func.isRequired,
    title:PropTypes.string
};
FileSearch.defaultProps={
    title:'我的文档'
};
export default FileSearch
