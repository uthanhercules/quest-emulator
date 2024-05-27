# [QUEST BASIC]

Trata-se de uma linguagem baseada em BASIC para facilitar a criação de jogos de aventura textual. Com ela, é possível executar jogos programados no navegador web utilizando a Quest Engine. Vamos a iniciar:

## [A SINTAXE]

Por se basear em BASIC, utilizaremos pointers numéricos para representar os pontos em história. Não é mais necessário escrever os pointers como múltiplos de 10. Isso é feito apenas como uma boa prática. A sintaxe é a seguinte:

|POINTER| |COMANDO| |DECLARAÇÃO|

Essa é a forma geral de como todos os comandos serão executados. Vamos lista-los abaixo.

## [OPERADORES LÓGICOS]

- Igual: =
- Diferente: <>
- Maior: >
- Menor: <
- Maior ou igual: >=
- Menor ou igual: <=

## [SET]

Define uma variável.

Exemplo:
0 SET NOME$ = "Maria"

## [PRINT]

Renderiza um texto em tela. É possível imprimir variáveis ao colocá-las entre colchetes.

## Exemplo:

0 PRINT "Olá, mundo!" [ALINHAMENTO?] [#COR?]
1 PRINT "Olá, [NOME$]" [ALINHAMENTO?] [#COR?]

## [INPUT]

Recebe um input do usuário e armazena em uma variável.

Exemplo:
0 INPUT NOME$

## [WAIT]

Recebe um input qualquer do usuário e não armazena em uma variável.

Exemplo:
0 WAIT [ALINHAMENTO?]

## [REM]

Comentário. Não é executado.

Exemplo:
0 REM "Isso é um comentário"

## [IF]

Condicional. Executa um bloco de código se a condição for verdadeira. Caso não seja, é possível utilizar o ELSE. É possível utilizar o FIRST para verificar apenas o primeiro caractere da variável. Caso o ELSE não seja utilizado, o bloco de código será executado pela ordem dos pointers.

Exemplo:
0 IF [NOME] = "Maria" THEN 1
1 IF [NOME] = "Maria" THEN 1 ELSE 2
2 IF [NOME] FIRST = "M" THEN 1

## [GOTO]

Vai para um pointer específico.

Exemplo:
0 GOTO 1

## [CLS]

Limpa a tela.

Exemplo:
0 CLS

## [END]

Finaliza o programa.

Exemplo:
0 END [ALINHAMENTO?]
