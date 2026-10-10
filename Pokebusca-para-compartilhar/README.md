# PokéBusca

## Sobre o projeto

O PokéBusca é uma aplicação web para pesquisar Pokémon e gerenciar uma lista de favoritos.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- PokéAPI
- Supabase
- Docker
- Nginx

## Funcionalidades

- Pesquisar Pokémon pelo nome ou número.
- Consultar imagem, tipo, altura e peso.
- Adicionar Pokémon aos favoritos.
- Listar e remover favoritos salvos no Supabase.

## Como executar com Docker

Baixe a imagem publicada:

```bash
docker pull eduardod5/pokebusca:1.0
```

Execute o contêiner:

```bash
docker run -d --name pokebusca-container -p 8080:80 eduardod5/pokebusca:1.0
```

Acesse http://localhost:8080 no navegador.

Para conferir as tags publicadas, visite https://hub.docker.com/r/eduardod5/pokebusca.

## Executar sem Docker

Abra `index.html` no navegador. A pesquisa utiliza a PokéAPI. Para os favoritos funcionarem, o projeto precisa estar configurado com as credenciais publicáveis corretas do Supabase e as permissões da tabela `favoritos`.

## Autor

Eduardo César Camargo dos Reis
