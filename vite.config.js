import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import {distributionCleanupPlugin} from './tools/distribution-cleanup.mjs';
export default defineConfig({
 plugins:[distributionCleanupPlugin()],
 // Asset preparation and archived client trees contain many thousands of files.
 // Watching them exhausts Windows handles and can stall the development server.
 // Runtime source and public assets remain watched and served normally.
 server:{watch:{ignored:['**/work/**','**/art/**','**/dist/**','**/docs/**']}},
 // Scan the active app entry points, excluding archived HTML under work/.
 optimizeDeps:{entries:['index.html','locomotion-compare.html','animation-workshop.html','animation-catalog.html','circle2-preview.html','breaker-preview.html','weapon-fitting.html','collision-test.html']},
 build:{rollupOptions:{input:{game:fileURLToPath(new URL('./index.html',import.meta.url)),locomotionCompare:fileURLToPath(new URL('./locomotion-compare.html',import.meta.url)),animationWorkshop:fileURLToPath(new URL('./animation-workshop.html',import.meta.url)),animationCatalog:fileURLToPath(new URL('./animation-catalog.html',import.meta.url)),circle2Preview:fileURLToPath(new URL('./circle2-preview.html',import.meta.url)),breakerPreview:fileURLToPath(new URL('./breaker-preview.html',import.meta.url)),weaponFitting:fileURLToPath(new URL('./weapon-fitting.html',import.meta.url)),collisionTest:fileURLToPath(new URL('./collision-test.html',import.meta.url))}}}});
