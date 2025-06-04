function insertOrCreateLayerWithAnimation(text, highlights) {
    try {
        app.beginUndoGroup("Insert Text into Selected Layer with Animation");

        // alert("Текст, полученный в After Effects:\n" + text); // Логирование

        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            alert("Нет активной композиции!"); // Логирование
            return "Нет активной композиции!";
        }

        // Проверяем, есть ли выделенный слой с текстом
        var selectedLayer = comp.selectedLayers[0];
        if (!selectedLayer || !selectedLayer.property("Source Text")) {
            alert("Выделенный слой не является текстовым!"); // Логирование
            return "Выделенный слой не является текстовым!";
        }

        // Вставляем текст в выделенный слой
        var textProp = selectedLayer.property("Source Text");
        var textDocument = textProp.value;
        textDocument.text = text; // Вставляем текст с переносами строк
        textProp.setValue(textDocument);

        // alert("Текст, вставленный в слой:\n" + textDocument.text); // Логирование

        // Очищаем все существующие аниматоры
        removeAllAnimators(selectedLayer);

        // Добавляем дефолтный аниматор для всего текста
        addTextAnimator(selectedLayer, "Default Text Animator", [1, 1, 1], 0, text.length);

        // Добавляем аниматор для подсвеченного текста
        if (highlights && highlights.length > 0) {
            for (var i = 0; i < highlights.length; i++) {
                var highlight = highlights[i];
                // Подсвеченный текст
                addTextAnimator(selectedLayer, "Highlight Animator", [0, 0.749, 1], highlight.start, highlight.end);
            }
        }

        // Копируем слой, удаляем его и вставляем обратно
        var layerIndex = selectedLayer.index; // Сохраняем индекс слоя
        var layerName = selectedLayer.name;
        var newL = selectedLayer.duplicate(); // Копируем слой
        selectedLayer.remove(); // Удаляем оригинальный слой
        newL.name = layerName;

        // Выделяем новый слой
        newL.selected = true;

        // alert("Текст успешно вставлен!"); // Логирование
        return "success";
    } catch (e) {
        alert("Ошибка: " + e.toString()); // Логирование
        return "error: " + e.toString();
    } finally {
        app.endUndoGroup();
    }
}

// Функция для удаления всех аниматоров на слое
function removeAllAnimators(layer) {
    if (!layer.Text.Animators) {
        return; // Если слой не текстовый, выходим
    }

    var animators = layer.Text.Animators;
    while (animators.numProperties > 0) {
        animators.property(1).remove(); // Удаляем первый аниматор
    }
}

// Функция для поиска всех подсвеченных фрагментов в тексте
function findHighlightRanges(html) {
    var ranges = [];
    var regex = /<span class="highlight">(.*?)<\/span>/g;
    var match;
    var plainText = stripHtmlTags(html); // Текст без HTML-тегов
    var offset = 0;

    while ((match = regex.exec(html)) !== null) {
        var highlightedText = match[1]; // Подсвеченный текст
        var start = plainText.indexOf(highlightedText, offset); // Начало подсветки
        if (start !== -1) {
            var end = start + highlightedText.length; // Конец подсветки
            ranges.push({ start: start, end: end });
            offset = end; // Сдвигаем offset для поиска следующего фрагмента
        }
    }

    return ranges;
}

// Функция для удаления HTML-тегов из текста
function stripHtmlTags(html) {
    // Простой способ удалить HTML-теги без использования document
    return html.replace(/<[^>]+>/g, '');
}

// Функция для добавления аниматора с цветом и селектором
function addTextAnimator(layer, animatorName, color, start, end) {
    // Проверяем, что слой поддерживает аниматоры
    if (!layer.Text.Animators) {
        return null; // Если слой не текстовый, выходим
    }

    // Убедимся, что start и end корректны
    if (start < 0 || end < 0 || start >= end) {
        return null; // Некорректные значения, пропускаем
    }

    // Добавляем аниматор
    var animator = layer.Text.Animators.addProperty("ADBE Text Animator");
    animator.name = animatorName; // Устанавливаем имя аниматора

    // Добавляем свойство "Fill Color" к аниматору
    var fillColor = animator.property("ADBE Text Animator Properties").addProperty("ADBE Text Fill Color");
    fillColor.setValue(color); // Устанавливаем цвет

    // Добавляем селектор для аниматора
    var selector = animator.property("ADBE Text Selectors").addProperty("ADBE Text Selector");

    // Настраиваем селектор
    var rangeAdvanced = selector.property("ADBE Text Range Advanced");
    rangeAdvanced.property("ADBE Text Range Units").setValue(2); // Процентный режим

    // Устанавливаем начало и конец выделения
    selector.property("ADBE Text Index Start").setValue(start); // Начало выделения
    selector.property("ADBE Text Index End").setValue(end); // Конец выделения

    return animator; // Возвращаем аниматор
}

function insertTextIntoSelectedAndDuplicatedLayers(text, highlights, index) {
    try {
        app.beginUndoGroup("Insert Text into Selected and Duplicated Layers");

        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            alert("Нет активной композиции!");
            return "Нет активной композиции!";
        }

        // Проверяем, есть ли выделенный слой
        var selectedLayer = comp.selectedLayers[0];
        if (!selectedLayer || !selectedLayer.property("Source Text")) {
            alert("Выделенный слой не является текстовым!");
            return "Выделенный слой не является текстовым!";
        }

        var targetLayer;

        if (index === 0) {
            // Если это первый блок, используем выделенный слой
            targetLayer = selectedLayer;
        } else {
            // Для последующих блоков дублируем выделенный слой
            targetLayer = selectedLayer.duplicate();

            // Устанавливаем inPoint нового слоя на outPoint предыдущего слоя
            var previousLayer = comp.layer(index); // Предыдущий слой
            targetLayer.inPoint = previousLayer.outPoint;
        }

        // Вставляем текст в целевой слой
        var textProp = targetLayer.property("Source Text");
        var textDocument = textProp.value;
        textDocument.text = text; // Вставляем текст с переносами строк
        textProp.setValue(textDocument);

        // Удаляем все существующие аниматоры
        removeAllAnimators(targetLayer);

        // Добавляем дефолтный аниматор для всего текста
        addTextAnimator(targetLayer, "Default Text Animator", [1, 1, 1], 0, text.length);

        // Добавляем аниматор для подсвеченного текста
        if (highlights && highlights.length > 0) {
            for (var i = 0; i < highlights.length; i++) {
                var highlight = highlights[i];
                addTextAnimator(targetLayer, "Highlight Animator", [0, 0.749, 1], highlight.start, highlight.end);
            }
        }

        // Копируем слой, удаляем его и вставляем обратно, чтобы избежать "распахнутости"
        var layerIndex = targetLayer.index; // Сохраняем индекс слоя
        var layerName = targetLayer.name;
        var newL = targetLayer.duplicate(); // Копируем слой
        targetLayer.remove(); // Удаляем оригинальный слой
        newL.name = layerName;

        // Выделяем новый слой
        newL.selected = true;

        return "success";
    } catch (e) {
        alert("Ошибка: " + e.toString());
        return "error: " + e.toString();
    } finally {
        app.endUndoGroup();
    }
}

function processTextBlocks(blocks) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) return "No active composition";
    
    // Ищем исходный слой TEXT_1
    var baseLayer = null;
    for (var i = 1; i <= comp.numLayers; i++) {
        if (comp.layer(i).name === "TEXT_1") {
            baseLayer = comp.layer(i);
            break;
        }
    }
    if (!baseLayer) return "Layer 'TEXT_1' not found";

    // Очищаем исходный слой
    if (baseLayer.property("ADBE Text Properties")) {
        baseLayer.property("ADBE Text Properties")
               .property("ADBE Text Document")
               .setValue(cleanHtmlText(blocks[0]));
    }

    // Обрабатываем блоки
    var prevLayer = baseLayer;
    for (var i = 1; i < blocks.length; i++) {
        // Дублируем слой
        var newLayer = prevLayer.duplicate();
        newLayer.name = "TEXT_" + (i + 1);
        
        // Устанавливаем текст с сохранением подсветки
        if (newLayer.property("ADBE Text Properties")) {
            newLayer.property("ADBE Text Properties")
                   .property("ADBE Text Document")
                   .setValue(cleanHtmlText(blocks[i]));
        }

        // Позиционируем под предыдущим слоем
        var prevBounds = prevLayer.sourceRectAtTime(0, false);
        newLayer.property("Position").setValue([
            prevLayer.property("Position").value[0],
            prevLayer.property("Position").value[1] + prevBounds.height + 20
        ]);

        prevLayer = newLayer;
    }
    
    return "success";
}

function cleanHtmlText(html) {
    // Создаем временный элемент для парсинга HTML
    var tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    
    // Обрабатываем подсвеченные элементы
    var highlights = tempDiv.querySelectorAll(".highlight");
    highlights.forEach(function(el) {
        el.outerHTML = "[[HIGHLIGHT]]" + el.textContent + "[[/HIGHLIGHT]]";
    });
    
    // Удаляем все HTML-теги, но сохраняем наши маркеры
    var text = tempDiv.textContent
        .replace(/\[\[HIGHLIGHT\]\]/g, "<span class='highlight'>")
        .replace(/\[\[\/HIGHLIGHT\]\]/g, "</span>");
    
    return text;
}
