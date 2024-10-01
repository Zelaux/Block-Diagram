# Block-Diagram

Блок схемы в соответсвии с ГОСТ 19.701-90(По крайней мере я старался)
<style>
svg{
background: var(--bgColor-default)
}
</style>

## Синтаксис

Пример

```lua
название(текст/параметры)(текст/параметры)[подпись 1][подпись 2...]{
    дочерний элемент 1
    дочерний элемент 2
}{
    дочерний элемент из другого списка дочерних элементов
}
```

У большинства элементов текст внутри элемента можно задать написав `(текст)`,
``` `текст` ```,`"текст"` после названия блока. Например

```flow-graph   
start(start1)
start`start2`
start"start3"
```

Обратите внимание, если вы хотите использовать закрывающий элемент(`)`, ``` ` ``` или `"`) внутри текста блока, то его
нужно экранировать
Например

```flow-graph
start(function1(a1, a2\))
end
```

## Элементы

Через `/` написаны вариант имени одного и того же элемента

### start

```flow-graph
start
start(Custom)
```

![loop.svg](doc%2Fstart.svg)

### end/stop

```flow-graph
end
end(Custom)
```

![loop.svg](doc%2Fend.svg)

### connector

```flow-graph
connector
connector(1)
```

![loop.svg](doc%2Fconnector.svg)

### program

Этот элемент улучшает визуальную состовляющую кода схемы, заменяя `start` и `end`

```flow-graph
program(CustomStart)(CustomEnd){
    data(Hello, world!)
}
```

![loop.svg](doc%2Fprogram.svg)

### process/block

```flow-graph
process(x = 0)
block(x = x + 1)
```

![loop.svg](doc%2Fprocess.svg)

### data/io

```flow-graph
data(Hello, world!)
io(Hello, world2!)
```

![loop.svg](doc%2Fdata.svg)

### function/func/fun/def

```flow-graph
function`function(a,b,c)`
func`func(a,b,c)`
fun`fun(a,b,c)`
def`def(a,b,c)`
```

![loop.svg](doc%2Ffunction.svg)

### if

Поддерживает `2` и `3` ветки. Названия по умолчанию имеются только для двух
Блок имеет дочерние блоки.

```flow-graph
if(x % 2 = 0){
    io(Чётное)
}{
    io(Нечётное)
}
if(x % 2)[0][1]{
    io(Чётное)
}{
    io(Нечётное)
}
if(x и 0)[<][==][>]{
    io(Меньше нуля)
}{
    io(Равно нулю)
}{
    io(Больше нуля)
}
```

![loop.svg](doc%2Fif.svg)

### loop

```flow-graph
block(x = 0)
loop(pre-text)(post-text){
    io(Тело цикла)
}
io(Done.)
```

![loop.svg](doc%2Floop.svg)

### for

Делает такой же loop, но при этом реализуя привычный нам for

```flow-graph
for(i = 0)(i < 10)(i++){
    io(i)
}
```

![for.svg](doc%2Ffor.svg)

### parallel/join

Имеет неограниченное число дочерних последовательностей элементов
Имеется возможность указать растояние между последовательностями

```flow-graph
parallel(20){
    start
    connector(1)
}{
    connector(1)
    connector(2)
}{
    connector(2)
    end
}
```

![parallel.svg](doc%2Fparallel.svg)

```flow-graph
parallel(20){
    connector(1)
}{
    connector(2)
}{
    connector(3)
}
io(Hello, world!)
end
```

![parallel_join2.svg](doc%2Fparallel_join2.svg)
