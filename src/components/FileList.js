import React, {useEffect, useRef, useState} from "react";
import PropTypes from 'prop-types'
import {fileList} from '../config/defaultFiles'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons'
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
import './FileList.css'
import useKeyPress from '../hooks/useKeyPress'
import useContextMenu from '../hooks/useContextMenu'
import { getParentNode } from '../utils/helper'

const FileList = ({files, onFileClick, onSaveEdit, onFileDelete}) =>{
    const [editingId,setEditingId] = useState('');
    // const [ editStatus, setEditStatus ] = useState(false)
    const [ value, setValue ] = useState('');

    const enterPressed = useKeyPress(13); //回车
    const escPressed = useKeyPress(27); // esc
    let node = useRef(null);
    const closeSearch = (editItem) =>{
        setEditingId('');
        setValue('');
        if (editItem.isNew) {
            onFileDelete(editItem.id)
        }

    };

    const clickedItem = useContextMenu([
        {
            label: '打开',
            click: () => {
                // console.log('clicking', clickedItem.current)
                const parentElement = getParentNode(clickedItem.current, 'file-item')
                if (parentElement) {
                    onFileClick(parentElement.dataset.id)
                }

            }
        },
        {
            label: '重命名',
            click: () => {
                // console.log('renaming')
                const parentElement = getParentNode(clickedItem.current, 'file-item')
                if (parentElement) {
                    const { id, title } = parentElement.dataset
                    setEditingId(id)
                    setValue(title)
                }

            }
        },
        {
            label: '删除',
            click: () => {
                // console.log('deleting')
                const parentElement = getParentNode(clickedItem.current, 'file-item')
                if (parentElement) {
                    onFileDelete(parentElement.dataset.id)
                }

            }
        },
    ], '.file-list',[files]);

    useEffect(() => {
        const editItem = files.find(file => file.id === editingId);
        if (enterPressed && editingId && value.trim() !== '') {
            onSaveEdit(editItem.id, value, editItem.isNew);
            setEditingId(false);
            setValue('')
        }
        if(escPressed && editingId) {
            closeSearch(editItem)
        }
    }, [files, enterPressed, editingId, value, escPressed, onSaveEdit, closeSearch]);
    useEffect(() => {
        const newFile = files.find(file => file.isNew);
        // console.log(newFile)
        if (newFile) {
            setEditingId(newFile.id);
            setValue(newFile.title)
        }
    }, [files]);
    useEffect(() => {
        if (editingId) {
            node.current.focus()
        }
    }, [editingId]);

    return(
        <ul className="list-group list-group-flush file-list">
            {
                files.map((file)=>{
                    return(<li key={file.id}
                               data-id={file.id}
                               data-title={file.title}
                               className="list-group-item row d-flex align-items-center file-item mx-0"
                    >
                        {editingId === file.id &&
                        <React.Fragment>
                            <input className="form-control col-10"
                                   ref={node}
                                   placeholder="请输入文件名称"
                                   value={value}
                                   onChange={(e) => { setValue(e.target.value) }}/>
                            <button type="button" className="icon-button col-2" onClick={() => {closeSearch(file)}}>
                                <FontAwesomeIcon title="关闭" icon={faTimes}/>
                            </button>
                        </React.Fragment>}
                        {editingId !== file.id &&
                        <React.Fragment>
                            <span className="col-2"><FontAwesomeIcon icon={faMarkdown}/></span>
                            <span className="col-6 c-link" onClick={() => {onFileClick(file.id)}}>{file.title}</span>
                            {/*<button type="button" className="icon-button col-2" onClick={() => {setEditingId(file.id);setValue(file.title)}}>
                                <FontAwesomeIcon title="编辑" icon={faEdit}/>
                            </button>
                            <button type="button" className="icon-button col-2" onClick={()=> {onFileDelete(file.id)}}>
                                <FontAwesomeIcon title="删除" icon={faTrash}/>
                            </button>*/}
                        </React.Fragment>}
                    </li>)
                })
            }
        </ul>
    )
};
FileList.propTypes={
    files:PropTypes.array,
    onFileClick: PropTypes.func,
    onFileDelete: PropTypes.func,
    onSaveEdit: PropTypes.func,
};
FileList.defaultProps={
    files:fileList
};
export default FileList
