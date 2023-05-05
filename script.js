const stepper = document.getElementById('stepper');

let gridSize = stepper.value; // Размер сетки установим равным 10 для простоты тестирования
const squareSize = 45; // Размер одного квадрата в пикселях 
let inputNodes = gridSize * gridSize; // Размер входного сигнала (100)
let isDrawing = false; // Для обработки движений мыши по канвасу 

const weights = []; // Массив весов сети

// Массив для хранения текущего состояния картинки в левом канвасе,
// он же является входным сигналом сети
let userImageState = [];

// Инициализация состояния
for (let i = 0; i < inputNodes; i += 1) {
    weights[i] = new Array(inputNodes).fill(0); // Создаем пустой массив и заполняем его 0. 
    userImageState[i] = -1;
}

// Получаем контекст канвасов: 
const userCanvas = document.getElementById('userCanvas');
const userContext = userCanvas.getContext('2d');
const netCanvas = document.getElementById('netCanvas');
const netContext = netCanvas.getContext('2d');

// Вычисляет индекс для изменения в массиве
// на основе координат и размера сетки 
const calcIndex = (x, y, size) => x + y * size;

// Проверяет, помещается ли индекс в массив 
const isValidIndex = (index, len) => index < len && index >= 0;

// Генерирует координаты для закрашивания клетки в пределах 
// размера сетки, на выходе будут значения от 0 до 9
const getNewSquareCoords = (canvas, clientX, clientY, size) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.ceil((clientX - rect.left) / size) - 1;
    const y = Math.ceil((clientY - rect.top) / size) - 1;
    return { x, y };
};

// Функция принимает контекст канваса и рисует
// сетку в 100 клеток (gridSize * gridSize)
const drawGrid = (ctx) => {
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    for (let row = 0; row < gridSize; row += 1) {
        for (let column = 0; column < gridSize; column += 1) {
            const x = column * squareSize;
            const y = row * squareSize;
            ctx.rect(x, y, squareSize, squareSize);
            ctx.fill();
            ctx.stroke();
        }
    }
    ctx.closePath();
};

const changeGridSize = (newSize) => {
    gridSize = newSize;
    inputNodes = newSize * newSize;
    userImageState = [];
    for (let i = 0; i < inputNodes; i += 1) {
        weights[i] = new Array(inputNodes).fill(0);
        userImageState[i] = -1;
    }

    userCanvas.width = newSize * squareSize;
    userCanvas.height = newSize * squareSize;
    netCanvas.width = newSize * squareSize;
    netCanvas.height = newSize * squareSize;
    drawGrid(userContext);
    drawGrid(netContext);
};

const drawImageFromArray = (data, ctx) => {
    const twoDimData = [];

    // Преобразуем одномерный массив в двумерный: 
    while (data.length) twoDimData.push(data.splice(0, gridSize));

    // Предварительно очищаем сетку: 
    drawGrid(ctx);

    // Рисуем изображение по координатам (индексам массива)
    for (let i = 0; i < gridSize; i += 1) {
        for (let j = 0; j < gridSize; j += 1) {
            if (twoDimData[i][j] === 1) {
                ctx.fillStyle = 'black';
                ctx.fillRect((j * squareSize), (i * squareSize), squareSize, squareSize);
            }
        }
    }
};

// Обработка клика мыши: 
const handleMouseDown = (e) => {
    userContext.fillStyle = 'black';

    // Рисуем залитый прямоугольник в позиции x, y
    // размером squareSize х squareSize (45х45 пикселей)
    userContext.fillRect(
        Math.floor(e.offsetX / squareSize) * squareSize,
        Math.floor(e.offsetY / squareSize) * squareSize,
        squareSize, squareSize,
    );

    // На основе координат вычисляем индекс,
    // необходимый для изменения состояния входного сигнала
    const { clientX, clientY } = e;
    const coords = getNewSquareCoords(userCanvas, clientX, clientY, squareSize);
    const index = calcIndex(coords.x, coords.y, gridSize);

    // Проверяем необходимо ли изменять этот элемент сигнала 
    if (isValidIndex(index, inputNodes) && userImageState[index] !== 1) {
        userImageState[index] = 1;
    }

    // Изменяем состояние (для обработки движения мыши) 
    isDrawing = true;
};

// Обработка движения мыши по канвасу: 
const handleMouseMove = (e) => {

    // Если не рисуем, т.е. не было клика мыши по канвасу, то выходим из функции
    if (!isDrawing) return;

    // Далее код, аналогичный функции handleMouseDown
    // за исключением последней строки isDrawing = true;
    userContext.fillStyle = 'black';
    userContext.fillRect(
        Math.floor(e.offsetX / squareSize) * squareSize,
        Math.floor(e.offsetY / squareSize) * squareSize,
        squareSize, squareSize,
    );

    const { clientX, clientY } = e;
    const coords = getNewSquareCoords(userCanvas, clientX, clientY, squareSize);
    const index = calcIndex(coords.x, coords.y, gridSize);

    if (isValidIndex(index, inputNodes) && userImageState[index] !== 1) {
        userImageState[index] = 1;
    }
};

const stopDrawing = () => {
    isDrawing = false;
};

// Чтобы убрать закрашенные клетки, просто заново отрисовываем 
// всю сетку и сбрасываем массив входного сигнала
const clearCurrentImage = () => {
    drawGrid(userContext);
    drawGrid(netContext);
    userImageState = new Array(gridSize * gridSize).fill(-1);
};

const memorizeImage = () => {
    for (let i = 0; i < inputNodes; i += 1) {
        for (let j = 0; j < inputNodes; j += 1) {
            if (i === j) weights[i][j] = 0;
            else {
                // Входной сигнал находится в массиве userImageState и является
                // набором -1 и 1, где -1 - это белый, а 1 - черный цвет клеток на канвасе
                weights[i][j] += userImageState[i] * userImageState[j];
            }
        }
    }
};

const recognizeSignal = () => {
    let prevNetState;
    // На вход сети подается неизвестный сигнал. Фактически 
    // его ввод осуществляется непосредственной установкой значений выходов
    // (2 шаг алгоритма), просто копируем массив входного сигнала
    const currNetState = [...userImageState];
    let counter = 0;
    do {
        // Копируем текущее состояние выходов, 
        // т.е. теперь оно становится предыдущим состоянием
        counter += 1;
        prevNetState = [...currNetState];

        // Рассчитываем выход сети согласно формуле 3 шага алгоритма: 
        for (let i = 0; i < inputNodes; i += 1) {
            let sum = 0;
            for (let j = 0; j < inputNodes; j += 1) {
                sum += weights[i][j] * prevNetState[j];
            }

            // Рассчитываем выход нейрона (пороговая ф-я активации). 
            currNetState[i] = sum >= 0 ? 1 : -1;
        }
        if (counter === 999) {
            const popup = document.getElementById('popup');
            popup.classList.toggle('show');
            console.log('Не могу вспомнить образ :(');
            return;
        }
    }
    // Проверка изменения выходов за последнюю итерацию
    // Сравниваем массивы при помощи ф-ии isEqual
    while (!_.isEqual(currNetState, prevNetState));

    drawImageFromArray(currNetState, netContext); // Если выходы стабилизировались (не изменились), отрисовываем восстановленный образ.
};

// Вешаем слушатели на кнопки: 
const resetButton = document.getElementById('resetButton');
const memoryButton = document.getElementById('memoryButton');
const recognizeButton = document.getElementById('recognizeButton');

// Вешаем слушатели на канвасы 
userCanvas.addEventListener('mousedown', (e) => handleMouseDown(e));
userCanvas.addEventListener('mousemove', (e) => handleMouseMove(e));

// Перестаём рисовать, если кнопка мыши отпущена или вышла за пределы канваса
userCanvas.addEventListener('mouseup', () => stopDrawing());
userCanvas.addEventListener('mouseleave', () => stopDrawing());

resetButton.addEventListener('click', () => clearCurrentImage());
memoryButton.addEventListener('click', () => memorizeImage());
recognizeButton.addEventListener('click', () => recognizeSignal());
stepper.addEventListener('change', () => changeGridSize(Number(stepper.value)));

// Отрисовываем сетку: 
drawGrid(userContext);
drawGrid(netContext);

// Готово!