# Some convience scripts to use when working on Parcel

## Installation

```bash
pnpm i
sudo ln -s $PWD/parcel-script /usr/local/bin/parcel-script
sudo ln -s $PWD/parcel-script /usr/local/bin/psct
```

## Autocomplete

For autocomplete support on zsh run this. You may add it to your `~/.zshrc`

```bash
eval "$(parcel-script autocomplete)"
```

## Usage

```bash
parcel-script {script-name}
psct {script-name}

# Example
parcel-script clean --all --dry
psct clean --all --dry
```

## Parcel DIR

```bash
export PARCEL_REPO_PATH=~/Development/parcel-bundler/parcel
parcel-script clean
```