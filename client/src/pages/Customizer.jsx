/* eslint-disable no-unused-vars */
import React from 'react';
import {useState,useEffect} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSnapshot } from 'valtio';

import config from '../config/config'; //will be used to set up the url of the backend
import state from '../store';
import {download} from '../assets';
import {downloadCanvasToImage,reader} from '../config/helpers';
import {EditorTabs,FilterTabs,DecalTypes} from '../config/constants';
import { fadeAnimation,slideAnimation} from '../config/motion';
import { AIPicker,ColorPicker,CustomButton,Tab,FilePicker } from '../components';
import { set } from 'mongoose';


const Customizer = () => {
  //we need to have access to the state to know in which page we are in 
  const snap = useSnapshot(state);

  const [file,setFile] = useState('');
  const[prompt,setPrompt] = useState('');
  const[generatingImg,setGeneratingImg] = useState(false);
  
  const[activeEditorTab,setActiveEditorTab] = useState('');
  const[activeFilterTab,setActiveFilterTab] = useState({
    logoShirt:true,
    stylishShirt:false,

  });

  //show tab content depending on the activeTab
  const generateTabContent = () => {
    switch(activeEditorTab) {
      case "colorpicker":
        return <ColorPicker />;
      case "filepicker":
        return <FilePicker 
          file={file}
          setFile={setFile}
          readFile={readFile}
          
        />;
      case "aipicker":
        return <AIPicker 
          prompt={prompt}
          setPrompt={setPrompt}
          generatingImg={generatingImg}
          handleSubmit={handleSubmit}
        />;
      default:
        return null;
    }
  }
   
  const handleSubmit = async (type) => {
    if(!prompt) return alert("Please enter a prompt")

    try {
      // call backedn to generate an ai image
      setGeneratingImg(true);

      const response = await fetch('http://localhost:5000/api/v1/dalle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
        })
      })

      const data = await response.json();

      handleDecals(type, `data:image/png;base64,${data.photo}`)
    }
    catch(err) {
      alert(err);
    }
    finally {
      setGeneratingImg(false);
      setActiveEditorTab("");
    }
  }
 

  const handleDecals = (type,result) => {
    const decalType = DecalTypes[type];

    // updating the state
    state[decalType.stateProperty ] = result;

    if ( !activeFilterTab[decalType.filterTab]){
      handleActiveFilterTab(decalType.filterTab);
    }

  }
     // to identify whether we are showing logo , texture or not 
     const handleActiveFilterTab = (tabName) => {
      switch (tabName) {
        case "logoShirt":
          state.isLogoTexture = !activeFilterTab[tabName];
         break;
         case "stylishShirt":
          state.isFullTexture = !activeFilterTab[tabName];
         break;
       default:
        state.isLogoTexture = true;
        state.isFullTexture = false;
      }        

      //after setting the state , activeFilterTab is updated

      setActiveFilterTab((prevState) => {
        return {
          ...prevState,
          [tabName] : !prevState[tabName]
        }
      })

  }



  const readFile = (type) => {
    reader(file)
      .then((result) => {
        handleDecals(type, result);
        setActiveEditorTab("");
      })
  }

  return (
    <AnimatePresence>
      {!snap.intro && (
        <>
         {/* starting with the tabs at the left hand side of the page */}
          <motion.div
            key='custom'
            className='absolute top-0 left-0 z-10'
            {...slideAnimation('left')}
          >
            <div className='flex items-center min-h-screen'>
              <div className='editortabs-container tabs'>
                {EditorTabs.map((tab) => (
                  <Tab
                    key={tab.name}
                    tab={tab}
                    handleClick = {()=> setActiveEditorTab(tab.name)}
                  />
                ))}

                {generateTabContent()}
              </div>
            </div>
          </motion.div>

          {/* this is for the go back button */}
          <motion.div
            className='absolute z-10 top-5 right-5'
            {...fadeAnimation}
          >
            <CustomButton
              type="filled"
              title='Go Back'
              // this will take us back to the home page
              handleClick={() => state.intro = true}  
              customStyles='w-fit px-4 py-2.5 font-bold text-sm'
            />
          </motion.div>

          <motion.div
            className='filtertabs-container'
            {...slideAnimation('up')}
          >
              {FilterTabs.map((tab) => (
                <Tab
                  key={tab.name}
                  tab={tab}
                  isFilterTab
                  isActiveTab={activeFilterTab[tab.name]}
                  handleClick={() => handleActiveFilterTab(tab.name)}
                />
                ))}
  
            <button className='download-btn' onClick={downloadCanvasToImage}>
              <img
                src={download}
                alt='download_image'
                className='w-3/5 h-3/5 object-contain'
              />
            </button>
            
          </motion.div>
        </>
        
      )}
    </AnimatePresence>
  )
}

export default Customizer