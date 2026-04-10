# @ocom/domain

This package contains all the application-specific Domain code



Recipe:


```shell
# Ensure mise is installed. The workspace root mise.toml specifies node = "22.22.2".
# If mise is not installed, run:
# curl https://mise.run | sh
# Restart your shell or activate mise for your shell (e.g. eval "$(~/.local/bin/mise activate zsh)")

mise install

npm i -D jest @types/jest -w @ocom/domain
npm i -D eslint @eslint/js typescript-eslint -w @ocom/domain
npx jest --init -w @ocom/domain
(choose node)


npm i @lucaspaganini/value-objects -w @ocom/domain

```



