'use client';

import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  Separator,
  BoldItalicUnderlineToggles,
  StrikeThroughSupSubToggles,
  BlockTypeSelect,
  ListsToggle,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertCodeBlock,
  InsertThematicBreak,
  type Translation,
} from '@mdxeditor/editor';

interface Props {
  markdown: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
}

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'Не удалось загрузить фото');
  return body.url as string;
}

// English default → Russian text, keyed by the library's message key.
// Falls back to the English default for anything not listed here.
const RU: Record<string, string> = {
  'codeBlock.inlineLanguage': 'Язык',
  'codeBlock.language': 'Язык блока кода',
  'codeBlock.selectLanguage': 'Выберите язык',
  'codeblock.delete': 'Удалить блок кода',
  'contentArea.editableMarkdown': 'область редактирования',
  'createLink.cancelTooltip': 'Отменить',
  'createLink.saveTooltip': 'Сохранить ссылку',
  'createLink.text': 'Текст ссылки',
  'createLink.textTooltip': 'Текст, который будет показан вместо ссылки',
  'createLink.title': 'Заголовок ссылки',
  'createLink.titleTooltip': 'Заголовок ссылки (необязательно)',
  'createLink.url': 'Адрес',
  'createLink.urlPlaceholder': 'Вставьте или введите адрес',
  'dialog.close': 'Закрыть',
  'dialogControls.cancel': 'Отмена',
  'dialogControls.save': 'Сохранить',
  'imageEditor.deleteImage': 'Удалить фото',
  'imageEditor.editImage': 'Изменить фото',
  'linkPreview.copied': 'Скопировано!',
  'linkPreview.copyToClipboard': 'Скопировать',
  'linkPreview.edit': 'Изменить ссылку',
  'linkPreview.remove': 'Удалить ссылку',
  'table.alignCenter': 'По центру',
  'table.alignLeft': 'По левому краю',
  'table.alignRight': 'По правому краю',
  'table.columnMenu': 'Меню столбца',
  'table.deleteColumn': 'Удалить столбец',
  'table.deleteRow': 'Удалить строку',
  'table.deleteTable': 'Удалить таблицу',
  'table.insertColumnLeft': 'Вставить столбец слева',
  'table.insertColumnRight': 'Вставить столбец справа',
  'table.insertRowAbove': 'Вставить строку выше',
  'table.insertRowBelow': 'Вставить строку ниже',
  'table.rowMenu': 'Меню строки',
  'table.textAlignment': 'Выравнивание текста',
  'toolbar.blockTypeSelect.placeholder': 'Тип блока',
  'toolbar.blockTypeSelect.selectBlockTypeTooltip': 'Выбрать тип блока',
  'toolbar.blockTypes.heading': 'Заголовок {{level}}',
  'toolbar.blockTypes.paragraph': 'Обычный текст',
  'toolbar.blockTypes.quote': 'Цитата',
  'toolbar.bold': 'Жирный',
  'toolbar.bulletedList': 'Маркированный список',
  'toolbar.checkList': 'Список-чеклист',
  'toolbar.codeBlock': 'Вставить код',
  'toolbar.highlight': 'Выделение цветом',
  'toolbar.image': 'Вставить фото',
  'toolbar.inlineCode': 'Формат кода',
  'toolbar.italic': 'Курсив',
  'toolbar.link': 'Вставить ссылку',
  'toolbar.numberedList': 'Нумерованный список',
  'toolbar.redo': 'Повторить {{shortcut}}',
  'toolbar.removeBold': 'Убрать жирный',
  'toolbar.removeHighlight': 'Убрать выделение',
  'toolbar.removeInlineCode': 'Убрать формат кода',
  'toolbar.removeItalic': 'Убрать курсив',
  'toolbar.removeStrikethrough': 'Убрать зачёркивание',
  'toolbar.removeSubscript': 'Убрать подстрочный',
  'toolbar.removeSuperscript': 'Убрать надстрочный',
  'toolbar.removeUnderline': 'Убрать подчёркивание',
  'toolbar.richText': 'Визуальный режим',
  'toolbar.source': 'Режим кода',
  'toolbar.strikethrough': 'Зачёркнутый',
  'toolbar.subscript': 'Подстрочный',
  'toolbar.superscript': 'Надстрочный',
  'toolbar.table': 'Вставить таблицу',
  'toolbar.thematicBreak': 'Вставить разделитель',
  'toolbar.underline': 'Подчёркнутый',
  'toolbar.undo': 'Отменить {{shortcut}}',
  'uploadImage.addViaUrlInstructions': 'Или добавьте фото по ссылке:',
  'uploadImage.addViaUrlInstructionsNoUpload': 'Добавьте фото по ссылке:',
  'uploadImage.alt': 'Описание:',
  'uploadImage.autoCompletePlaceholder': 'Вставьте адрес фото',
  'uploadImage.dialogTitle': 'Загрузка фото',
  'uploadImage.height': 'Высота:',
  'uploadImage.title': 'Заголовок:',
  'uploadImage.uploadInstructions': 'Загрузите фото с устройства:',
  'uploadImage.width': 'Ширина:',
};

const ruTranslation: Translation = (key, defaultValue, interpolations) => {
  let text = RU[key] ?? defaultValue;
  if (interpolations) {
    for (const [k, v] of Object.entries(interpolations)) {
      text = text.replaceAll(`{{${k}}}`, String(v));
    }
  }
  return text;
};

/**
 * The actual rich-text editor. Kept in its own client-only module because
 * MDXEditor (Lexical) touches browser globals at import time and must never
 * be evaluated during SSR — see MarkdownEditor.tsx's dynamic(..., {ssr:false}).
 */
export default function RichMarkdownEditor({ markdown, onChange, placeholder }: Props) {
  return (
    <div className="tc-mdx overflow-hidden rounded-xl border border-ink/10 bg-white">
      <MDXEditor
        markdown={markdown}
        onChange={onChange}
        placeholder={placeholder}
        translation={ruTranslation}
        contentEditableClassName="tc-mdx-content"
        plugins={[
          headingsPlugin({ allowedHeadingLevels: [2, 3] }),
          listsPlugin(),
          quotePlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          thematicBreakPlugin(),
          tablePlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: '' }),
          imagePlugin({ imageUploadHandler: uploadImage }),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarClassName: 'tc-mdx-toolbar',
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <BoldItalicUnderlineToggles options={['Bold', 'Italic']} />
                <StrikeThroughSupSubToggles options={['Strikethrough']} />
                <Separator />
                <ListsToggle />
                <Separator />
                <CreateLink />
                <InsertImage />
                <InsertTable />
                <InsertCodeBlock />
                <InsertThematicBreak />
              </>
            ),
          }),
        ]}
      />
    </div>
  );
}
