# Some convience scripts to use when working on Parcel

## Installation

```bash
wget --no-check-certificate https://github.com/alshdavid-labs/parcel-scripts/archive/refs/heads/main.zip
# Or
curl -LJO https://github.com/alshdavid-labs/parcel-scripts/archive/refs/heads/main.zip 

mv parcel-scripts-main $HOME/.local/parcel-scripts
cd $HOME/.local/parcel-scripts
npm install

export PARCEL_SRC_PATH="$HOME/Development/parcel-bundler/parcel"
export PATH="$HOME/.local/parcel-scripts/bin:$PATH"
```
