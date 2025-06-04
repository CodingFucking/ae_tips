// Инициализация CSInterface
var csInterface = new CSInterface();

// Элементы интерфейса
var textInput = document.getElementById("textInput");
var clearButton = document.getElementById("clearButton");
var insertOrCreateButton = document.getElementById("insertOrCreateButton");
var formatButton = document.getElementById("formatButton");

// Текущий размер шрифта
var currentFontSize = 30; // Размер по умолчанию 30px

// Очистка текстового поля
clearButton.addEventListener("click", function () {
    textInput.innerHTML = "";
    console.log("Текстовое поле очищено");
    textInput.focus(); // Восстанавливаем фокус
});

// Обработчик кнопки "Форматировать"
formatButton.addEventListener("click", function () {
    formatText(textInput); // Применяем форматирование
    formatText(textInput); // Двойной вызов для надёжности
});

function findHighlightRanges(html) {
    var ranges = [];
    var regex = /<span class="highlight">(.*?)<\/span>/g;
    var match;
    var plainText = stripHtmlTags(html); // Текст без HTML-тегов
    var plainTextWithoutNewlines = plainText.replace(/\n/g, ''); // Текст без переносов строк
    var offset = 0;

    while ((match = regex.exec(html)) !== null) {
        var highlightedText = match[1]; // Подсвеченный текст
        var start = plainTextWithoutNewlines.indexOf(highlightedText, offset); // Начало подсветки
        if (start !== -1) {
            var end = start + highlightedText.length; // Конец подсветки
            ranges.push({ start: start, end: end });
            offset = end; // Сдвигаем offset для поиска следующего фрагмента
        }
    }

    return ranges;
}

// Функция для экранирования специальных символов
function escapeString(str) {
    return str
        .replace(/\\/g, '\\\\')  // Экранируем обратные слэши
        .replace(/"/g, '\\"')    // Экранируем кавычки
        .replace(/\n/g, '\\n')   // Сохраняем переносы строк
        .replace(/\r/g, '\\r')   // Сохраняем возврат каретки
        .replace(/\t/g, '\\t');  // Экранируем табуляцию
}

function stripHtmlTags(html) {
    // Заменяем <div> на \n для сохранения переносов строк
    html = html.replace(/<div[^>]*>/gi, '\n');
    // Заменяем <br> на \n для сохранения переносов строк
    html = html.replace(/<br\s*\/?>/gi, '\n');
    // Удаляем остальные HTML-теги
    html = html.replace(/<[^>]+>/g, '');
    // Удаляем лишние пробелы в начале и конце
    html = html.trim();
    return html;
}

// Функция для получения HTML-содержимого выделенного текста
function getSelectedHtml(element) {
    var selectedText = window.getSelection().toString();
    if (!selectedText) {
        return element.innerHTML; // Если ничего не выделено, возвращаем весь текст
    }

    var range = window.getSelection().getRangeAt(0);
    var div = document.createElement("div");
    div.appendChild(range.cloneContents());
    return div.innerHTML;
}

// Обработчик кнопки "Вставить" с учётом зажатого Shift
insertOrCreateButton.addEventListener("click", function (event) {
    if (event.shiftKey) {
        alternativeFunction();  
    } else {
        // Если Shift не зажат, выполняем стандартную функцию
        standardInsertFunction();
    }
});

// Стандартная функция вставки
function standardInsertFunction() {
    // Получаем выделенный текст или весь текст, если ничего не выделено
    var selectedText = window.getSelection().toString();
    var formattedText = getSelectedHtml(textInput);

    // Если текст не выделен, используем весь текст из поля
    if (!selectedText) {
        formattedText = textInput.innerHTML;
    }

    // Находим подсвеченные фрагменты ДО очистки текста
    var highlights = findHighlightRanges(formattedText);

    // Удаляем HTML-теги, но сохраняем переносы строк
    var plainText = stripHtmlTags(formattedText);

    // Экранируем текст перед передачей в After Effects
    var escapedText = escapeString(plainText);

    // Отправляем отформатированный текст и информацию о подсветке в After Effects
    csInterface.evalScript(
        'insertOrCreateLayerWithAnimation("' + escapedText + '", ' + JSON.stringify(highlights) + ')',
        function (result) {
            if (result === "success") {
                // console.log("Текст успешно вставлен или слой создан!"); // Логирование
            } else if (result) {
                showCustomAlert("Ошибка: " + result);
            } else {
                showCustomAlert("Произошла неизвестная ошибка!");
            }
        }
    );
}

// Полная реализация с HTML-поддержкой
function splitTextIntoBlocks(html) {
    // Сохраняем подсвеченные участки специальными маркерами
    html = html.replace(/<span class="highlight">/g, '[[HIGHLIGHT_START]]')
              .replace(/<\/span>/g, '[[HIGHLIGHT_END]]');
    
    // Заменяем HTML-переносы на символы
    html = html.replace(/<div[^>]*>/gi, '\n')
              .replace(/<br\s*\/?>/gi, '\n');
    
    // Разделяем на блоки по пустым строкам
    var blocks = html.split(/\n\s*\n/).filter(Boolean);
    
    // Восстанавливаем подсветку в каждом блоке
    return blocks.map(function(block) {
        return block.replace(/\[\[HIGHLIGHT_START\]\]/g, '<span class="highlight">')
                   .replace(/\[\[HIGHLIGHT_END\]\]/g, '</span>');
    });
}

function alternativeFunction() {
    try {
        // Получаем и обрабатываем текст
        var fullText = textInput.innerHTML;
        var blocks = splitTextIntoBlocks(fullText);
        
        // Проверяем наличие блоков
        if (blocks.length === 0) {
            showCustomAlert("Нет текстовых блоков для обработки");
            return;
        }
        
        // Диагностика
        console.log("Найдено блоков:", blocks.length);
        blocks.forEach(function(block, i) {
            console.log("Блок " + (i+1) + ":", block);
        });
        
        // Отправляем в After Effects
        csInterface.evalScript(
            'processTextBlocks(' + JSON.stringify(blocks) + ')',
            function(result) {
                if (result === "success") {
                    showCustomAlert("Успешно создано слоев: " + blocks.length);
                    
                    // Дополнительная диагностика
                    console.log("Процесс завершен. Создано слоев:", blocks.length);
                    blocks.forEach(function(_, i) {
                        console.log("Слой TEXT_" + (i+1) + " создан");
                    });
                } else {
                    showCustomAlert("Ошибка обработки: " + result);
                    console.error("Ошибка:", result);
                }
            }
        );
    } catch (error) {
        showCustomAlert("Критическая ошибка: " + error.message);
        console.error("Ошибка выполнения:", error);
    }
}

// Устанавливаем фокус на текстовое поле при загрузке
textInput.focus();

// Функция для отображения кастомного alert
function showCustomAlert(message) {
    var customAlert = document.getElementById("customAlert");
    var customAlertMessage = document.getElementById("customAlertMessage");
    var customAlertClose = document.getElementById("customAlertClose");

    // Устанавливаем текст сообщения
    customAlertMessage.textContent = message;

    // Показываем модальное окно
    customAlert.style.display = "flex";

    // Закрытие модального окна при нажатии на кнопку
    customAlertClose.addEventListener("click", function () {
        customAlert.style.display = "none";
    });

    // Закрытие модального окна при клике вне его области
    customAlert.addEventListener("click", function (event) {
        if (event.target === customAlert) {
            customAlert.style.display = "none";
        }
    });
}
