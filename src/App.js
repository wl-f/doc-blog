import React, {useState} from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'
import SimpleMDE from "react-simplemde-editor"
import "easymde/dist/easymde.min.css";
import FileSearch from './components/FileSearch'
import FileList from './components/FileList'
import BottomBtn from './components/BottomBtn'
import { faPlus, faFileImport, faSave } from '@fortawesome/free-solid-svg-icons'
import TabList from './components/TabList'
import './App.css'
import uuidv4 from 'uuid/v4'
import { flattenArr, objToArr } from './utils/helper'
import fileHelper from './utils/fileHelper'
import useIpcRenderer from './hooks/useIpcRenderer'

//  node.js modules
const { join, basename, extname, dirname } = window.require('path')
const { remote } = window.require('electron');

const Store = window.require('electron-store');
const fileStore = new Store({'name': 'Files Data'});
const settingsStore = new Store({name: 'Settings'})

const saveFilesToStore = (files) => {
    const filesStoreObj = objToArr(files).reduce((result, file) => {
        const { id, path, title, createdAt } = file;
        result[id] = {
            id,
            path,
            title,
            createdAt,
        };
        return result
    }, {});
    fileStore.set('files', filesStoreObj)
};

function App() {
    // const [ files, setFiles ] = useState(flattenArr(fileList)); // 所有文件
    const [ files, setFiles ] = useState(fileStore.get('files') || {})
    const [ activeFileID, setActiveFileID ] =useState(''); // 选中的文件
    const [ openedFileIDs, setOpenedFileIDs ] = useState([]); //打开的文件
    const [ unsavedFileIDs, setUnsavedFileIDs ] = useState([]); //未保存的文件
    const [ searchedFiles, setSearchedFiles ] = useState([]); // 搜索文件列表

    // console.log(files);

    const filesArr = objToArr(files);
    // const activeFile = files[activeFileID];// 通过id查找所有打开的文件具体信息
    // const openedFiles = openedFileIDs.map(openID => {// 通过id查找选中的文件的具体信息
    //     return files[openID]
    // });
    // const fileListArr = (searchedFiles.length > 0) ? searchedFiles : filesArr;
    // const savedLocation = remote.app.getPath('documents')
    const savedLocation = settingsStore.get('savedFileLocation') || remote.app.getPath('documents')
    const activeFile = files[activeFileID]
    const openedFiles = openedFileIDs.map(openID => {
        return files[openID]
    })
    const fileListArr = (searchedFiles.length > 0) ? searchedFiles : filesArr


    const tabCloseWithConfirmation = (id) => {
        // show confrim message box for unsaved files
        if (unsavedFileIDs.includes(id)) {
            let options  = {
                buttons: ["保存","不保存","取消"],
                message: "你是否要保存已修改的文件"
            }
            remote.dialog.showMessageBox(options, (response, checkboxChecked) => {
                console.log(response)
                if (response === 0) {
                    saveCurrentFile()
                    setUnsavedFileIDs(unsavedFileIDs.filter(fileId => fileId !== id))
                    tabClose(id)
                } else if (response === 1) {
                    // if current file is unsaved
                    // reset current file isLoaded to false to trigger reload
                    const newFile = { ...files[id], isLoaded: false }
                    setFiles({ ...files, [id]: newFile })
                    setUnsavedFileIDs(unsavedFileIDs.filter(fileId => fileId !== id))
                    tabClose(id)
                }
            })
        } else {
            tabClose(id)
        }
    }

    const fileClick = (fileID) => {
        // set current active file
        setActiveFileID(fileID);
        const currentFile = files[fileID]
        if (!currentFile.isLoaded) {
            fileHelper.readFile(currentFile.path).then(value => {
                const newFile = { ...files[fileID], body: value, isLoaded: true }
                setFiles({ ...files, [fileID]: newFile })
            })
        }

        // if openedFiles don't have the current ID
        // then add new fileID to openedFiles
        if (!openedFileIDs.includes(fileID)) {
            setOpenedFileIDs([ ...openedFileIDs, fileID ])
        }
    };

    const tabClick = (fileID) => {
        // set current active file
        setActiveFileID(fileID)
    };

    const tabClose = (id) => {
        console.log('tabClose--',id,'openedFileIDs--',openedFileIDs)
        //remove current id from openedFileIDs
        const tabsWithout = openedFileIDs.filter(fileID => fileID !== id);
        setOpenedFileIDs(tabsWithout);
        // set the active to the first opened tab if still tabs left
        if (tabsWithout.length > 0) {
            setActiveFileID(tabsWithout[0])
        } else {
            setActiveFileID('')
        }
    };

    const fileChange = (id, value) => {
        // const newFile = { ...files[id], body: value };
        // setFiles({ ...files, [id]: newFile });
        //
        // // update unsavedIDs
        // if (!unsavedFileIDs.includes(id)) {
        //     setUnsavedFileIDs([ ...unsavedFileIDs, id])
        // }

        if (value !== files[id].body) {
            const newFile = { ...files[id], body: value }
            setFiles({ ...files, [id]: newFile })
            // update unsavedIDs
            if (!unsavedFileIDs.includes(id)) {
                setUnsavedFileIDs([ ...unsavedFileIDs, id])
            }
        }
    };
    const deleteFile = (id) => {
        // delete files[id];
        // setFiles(files);

        // 如果文件在打开状态,关闭该窗口
        // tabClose(id)
        // fileHelper.deleteFile(files[id].path).then(() => {
        //     delete files[id]
        //     setFiles(files)
        //     saveFilesToStore(files)
        //     // close the tab if opened
        //     tabClose(id)
        // })

        if (files[id].isNew) {
            const { [id]: value, ...afterDelete } = files;
            setFiles(afterDelete)
        } else {
            fileHelper.deleteFile(files[id].path).then(() => {
                tabClose(id);
                const { [id]: value, ...afterDelete } = files;
                console.log('afterDelete---',afterDelete)
                setFiles(afterDelete);
                saveFilesToStore(afterDelete);
            })
        }
    };
    const updateFileName = (id, title, isNew) => {
        // const modifiedFile = { ...files[id], title, isNew: false }
        // if (isNew) {
        //     fileHelper.writeFile(join(savedLocation, `${title}.md`), files[id].body).then(() => {
        //         setFiles({ ...files, [id]: modifiedFile})
        //     })
        // } else {
        //     fileHelper.renameFile(join(savedLocation, `${files[id].title}.md`),
        //         join(savedLocation, `${title}.md`)
        //     ).then(() => {
        //         setFiles({ ...files, [id]: modifiedFile})
        //     })
        // }

        // const newPath = join(savedLocation, `${title}.md`)
        const newPath = isNew ? join(savedLocation, `${title}.md`)
            : join(dirname(files[id].path), `${title}.md`)

        const modifiedFile = { ...files[id], title, isNew: false, path: newPath }
        const newFiles = { ...files, [id]: modifiedFile }
        if (isNew) {
            fileHelper.writeFile(newPath, files[id].body).then(() => {
                setFiles(newFiles)
                saveFilesToStore(newFiles)
            })
        } else {
            // const oldPath = join(savedLocation, `${files[id].title}.md`)
            const oldPath = files[id].path
            fileHelper.renameFile(oldPath, newPath).then(() => {
                setFiles(newFiles)
                saveFilesToStore(newFiles)
            })
        }

    };
    const fileSearch = (keyword) => {
        // filter out the new files based on the keyword
        const newFiles = filesArr.filter(file => file.title.includes(keyword));
        setSearchedFiles(newFiles)
    };
    const createNewFile = () => {
        const newID = uuidv4();
        const newFile = {
            id: newID,
            title: '',
            body: '## 请输出 Markdown',
            createdAt: new Date().getTime(),
            isNew: true,
        };
        setFiles({ ...files, [newID]: newFile })

    };

    const saveCurrentFile = () => {
        fileHelper.writeFile(activeFile.path,
            activeFile.body
        ).then(() => {
            setUnsavedFileIDs(unsavedFileIDs.filter(id => id !== activeFile.id))
        })
    };

    const importFiles = () => {
        remote.dialog.showOpenDialog({
            title: '选择导入的 Markdown 文件',
            properties: ['openFile', 'multiSelections'],
            filters: [
                {name: 'Markdown files', extensions: ['md']}
            ]
        }).then((result)=>{
            console.log('importFiles--',result.filePaths)
            const paths = result.filePaths
            if (Array.isArray(paths)) {
                // filter out the path we already have in electron store
                // ["/Users/liusha/Desktop/name1.md", "/Users/liusha/Desktop/name2.md"]
                const filteredPaths = paths.filter(path => {
                    const alreadyAdded = Object.values(files).find(file => {
                        return file.path === path
                    })
                    return !alreadyAdded
                })
                // extend the path array to an array contains files info
                // [{id: '1', path: '', title: ''}, {}]
                const importFilesArr = filteredPaths.map(path => {
                    return {
                        id: uuidv4(),
                        title: basename(path, extname(path)),
                        path,
                    }
                })
                // get the new files object in flattenArr
                const newFiles = { ...files, ...flattenArr(importFilesArr)}
                // setState and update electron store
                setFiles(newFiles)
                saveFilesToStore(newFiles)
                if (importFilesArr.length > 0) {
                    remote.dialog.showMessageBox({
                        type: 'info',
                        title: `成功导入了${importFilesArr.length}个文件`,
                        message: `成功导入了${importFilesArr.length}个文件`,
                    })
                }
            }
        })
    };

    useIpcRenderer({
        'create-new-file': createNewFile,
        'import-file': importFiles,
        'save-edit-file': saveCurrentFile,
    })

    return (
    <div className="container-fluid">
      <div className="row no-gutters">
          <div className="col-3 bg-light left-panel">
              <FileSearch onFileSearch={fileSearch}/>
              <FileList
                  files={fileListArr}
                  onFileClick={fileClick}
                  onFileDelete={deleteFile}
                  onSaveEdit={updateFileName}
              />
              <div className="row no-gutters button-group">
                  <div className="col">
                      <BottomBtn
                          text="新建"
                          colorClass="btn-primary"
                          icon={faPlus}
                          onBtnClick={createNewFile}
                      />
                  </div>
                  <div className="col">
                      <BottomBtn
                          text="导入"
                          colorClass="btn-success"
                          icon={faFileImport}
                          onBtnClick={importFiles}
                      />
                  </div>
              </div>
          </div>

          <div className="col-9">
              {!activeFileID &&
              <div className="start-page">
                  选择或者创建新的 Markdown 文档
              </div>
              }
              {
                  activeFileID &&
                      <>
                          <TabList
                              files={openedFiles}
                              activeId={activeFileID}
                              unsaveIds={unsavedFileIDs}
                              onTabClick={tabClick}
                              // onCloseTab={tabClose}
                              onCloseTab={tabCloseWithConfirmation}
                          />
                          <SimpleMDE
                              key={activeFile && activeFile.id}
                              value={activeFile && activeFile.body}
                              onChange={(value) => {fileChange(activeFile.id, value)}}
                              options={{
                                  minHeight: '515px'
                              }}
                          />
                      </>

              }
          </div>
      </div>
    </div>
  );
}

export default App;
