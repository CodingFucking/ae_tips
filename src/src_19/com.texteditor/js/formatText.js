// Функция для форматирования текста
function formatText(textInput) {
    // Сохраняем текущую позицию курсора
    var selection = window.getSelection();
    var range = selection.getRangeAt(0);
    var startOffset = range.startOffset;
    var endOffset = range.endOffset;
    var startContainer = range.startContainer;
    var endContainer = range.endContainer;

    // Получаем текущий текст
    var text = textInput.innerHTML;

    // Создаем временный контейнер для работы с HTML
    var tempDiv = document.createElement("div");
    tempDiv.innerHTML = text;

    // Функция для рекурсивного обхода и форматирования
    function formatNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            // Обрабатываем текстовые узлы
            var content = node.textContent;
            // Заменяем текст в звёздочках на <span class="highlight">
            content = content.replace(/\*(.*?)\*/g, '<span class="highlight">$1</span>');
            // Создаем новый элемент с отформатированным текстом
            var span = document.createElement("span");
            span.innerHTML = content;
            // Заменяем текстовый узел на новый элемент
            node.replaceWith(span);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Обрабатываем элементы (теги)
            if (node.tagName === "U") {
                // Если это тег <u>, оборачиваем его содержимое в <span class="highlight">
                var span = document.createElement("span");
                span.className = "highlight";
                while (node.firstChild) {
                    span.appendChild(node.firstChild);
                }
                node.replaceWith(span);
            } else if (node.classList.contains("highlight")) {
                // Если это уже отформатированный текст, пропускаем
                return;
            } else {
                // Рекурсивно обрабатываем дочерние элементы
                Array.from(node.childNodes).forEach(formatNode);
            }
        }
    }

    // Обрабатываем все узлы внутри временного контейнера
    Array.from(tempDiv.childNodes).forEach(formatNode);

    // Вставляем отформатированный текст обратно
    textInput.innerHTML = tempDiv.innerHTML;

    // Восстанавливаем позицию курсора
    var newRange = document.createRange();
    newRange.setStart(startContainer, startOffset);
    newRange.setEnd(endContainer, endOffset);
    selection.removeAllRanges();
    selection.addRange(newRange);

    // Восстанавливаем фокус
    textInput.focus();
}
