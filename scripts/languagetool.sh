#!/bin/sh

echo "Starting LanguageTool helper script!"
echo "This script will download LanguageTool and/or start it on port ${PORT:-8081}"

# TODO: LanguageTool folder should be get automatically.

if [ ! -d data/ ]; then
    mkdir data/
fi

if [ ! -f data/LanguageTool-6.0/languagetool.jar ]; then
     echo "Downloading LanguageTool-stable.zip"
 
     if [ -f data/LanguageTool-stable.zip ]; then
         echo "LanguageTool-stable.zip already exists"
     else
         if ! command -v curl &> /dev/null
         then
             echo "Curl could not be found"
             exit 1
         fi

         curl -L https://languagetool.org/download/LanguageTool-6.0.zip -o data/LanguageTool-stable.zip
         if [ $? -ne 0 ]; then
             echo "Failed to download LanguageTool-stable.zip"
             exit 1
         fi

         echo "Downloaded LanguageTool-stable.zip"
         echo "Unzipping LanguageTool-stable.zip"
         unzip -o data/LanguageTool-stable.zip -d data
         if [ $? -ne 0 ]; then
             echo "Failed to unzip LanguageTool-stable.zip"
             exit 1
         fi
     fi
fi

echo "Starting LanguageTool"
echo "
@@@@@@@@@@@@@@@@@@@@@@                                     @@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@                                                       @@@@@@@@@@@@
@@@@@@@@@                                                               @@@@@@@@
@@@@@@                                                                     @@@@@
@@@@                                                                         @@@
@@@                                                                           @@
@@                                                                             @
@                                                                               
@                                                                               
                                                                                
                       &&&&&&&&      &&&&&&&&&&&&&&&&&&&&&&                     
                       &&&&&&&&     %&&&&&&&&&&&&&&&&&&&&&&                     
                          &&&&&     %&&&&.   &&&&&    &&&&&                     
                          &&&&&              &&&&&                              
                          &&&&&              &&&&&                              
                          &&&&&              &&&&&                              
                          &&&&&              &&&&&                              
                          &&&&&&&&&&&&&&&    &&&&&                              
                             &&&&&&&&&&&&    &&&&&                              
                                                                                
                     .********           *********                              
                  ***************     ***************     *****,                
                ********   *****************   *****************                
                   **         ***********         ***********                   
@                                                                               
@                                                                               
@@                                                                             @
@@@                                                                           @@
@@@@@                                                                       @@@@
@@@@@@@                                                                   @@@@@@
@@@@@@@@@(                                                             &@@@@@@@@
@@@@@@@@@@@@@@                                                     @@@@@@@@@@@@@
                                LanguageTool 6.0"

java -cp data/LanguageTool-6.0/languagetool.jar org.languagetool.server.HTTPServer --port ${PORT:-8081}
if [ $? -ne 0 ]; then
    echo "Failed to start LanguageTool"
    exit 1
fi

