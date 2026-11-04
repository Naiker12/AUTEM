(function(){
var translateObjs = {};
function trans(a, b) {
    var c = arguments['length'] === 0x1 ? [arguments[0x0]] : Array['apply'](null, arguments);
    return translateObjs[c[0x0]] = c, '';
}
function regTextVar(a, b) {
    var c = ![];
    return d(b);
    function d(k, l) {
        switch (k['toLowerCase']()) {
        case 'title':
        case 'subtitle':
        case 'photo.title':
        case 'photo.description':
            var m = (function () {
                switch (k['toLowerCase']()) {
                case 'title':
                case 'photo.title':
                    return 'media.label';
                case 'subtitle':
                    return 'media.data.subtitle';
                case 'photo.description':
                    return 'media.data.description';
                }
            }());
            if (m)
                return function () {
                    var r, s, t = (l && l['viewerName'] ? this['getComponentByName'](l['viewerName']) : undefined) || this['getMainViewer']();
                    if (k['toLowerCase']()['startsWith']('photo'))
                        r = this['getByClassName']('PhotoAlbumPlayListItem')['filter'](function (v) {
                            var w = v['get']('player');
                            return w && w['get']('viewerArea') == t;
                        })['map'](function (v) {
                            return v['get']('media')['get']('playList');
                        });
                    else
                        r = this['_getPlayListsWithViewer'](t), s = j['bind'](this, t);
                    if (!c) {
                        for (var u = 0x0; u < r['length']; ++u) {
                            r[u]['bind']('changing', f, this);
                        }
                        c = !![];
                    }
                    return i['call'](this, r, m, s);
                };
            break;
        case 'tour.name':
        case 'tour.description':
            return function () {
                return this['get']('data')['tour']['locManager']['trans'](k);
            };
        default:
            if (k['toLowerCase']()['startsWith']('viewer.')) {
                var n = k['split']('.'), o = n[0x1];
                if (o) {
                    var p = n['slice'](0x2)['join']('.');
                    return d(p, { 'viewerName': o });
                }
            } else {
                if (k['toLowerCase']()['startsWith']('quiz.') && 'Quiz' in TDV) {
                    var q = undefined, m = (function () {
                            switch (k['toLowerCase']()) {
                            case 'quiz.questions.answered':
                                return TDV['Quiz']['PROPERTY']['QUESTIONS_ANSWERED'];
                            case 'quiz.question.count':
                                return TDV['Quiz']['PROPERTY']['QUESTION_COUNT'];
                            case 'quiz.items.found':
                                return TDV['Quiz']['PROPERTY']['ITEMS_FOUND'];
                            case 'quiz.item.count':
                                return TDV['Quiz']['PROPERTY']['ITEM_COUNT'];
                            case 'quiz.score':
                                return TDV['Quiz']['PROPERTY']['SCORE'];
                            case 'quiz.score.total':
                                return TDV['Quiz']['PROPERTY']['TOTAL_SCORE'];
                            case 'quiz.time.remaining':
                                return TDV['Quiz']['PROPERTY']['REMAINING_TIME'];
                            case 'quiz.time.elapsed':
                                return TDV['Quiz']['PROPERTY']['ELAPSED_TIME'];
                            case 'quiz.time.limit':
                                return TDV['Quiz']['PROPERTY']['TIME_LIMIT'];
                            case 'quiz.media.items.found':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_ITEMS_FOUND'];
                            case 'quiz.media.item.count':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_ITEM_COUNT'];
                            case 'quiz.media.questions.answered':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_QUESTIONS_ANSWERED'];
                            case 'quiz.media.question.count':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_QUESTION_COUNT'];
                            case 'quiz.media.score':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_SCORE'];
                            case 'quiz.media.score.total':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_TOTAL_SCORE'];
                            case 'quiz.media.index':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_INDEX'];
                            case 'quiz.media.count':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_COUNT'];
                            case 'quiz.media.visited':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_VISITED_COUNT'];
                            default:
                                var s = /quiz\.([\w_]+)\.(.+)/['exec'](k);
                                if (s) {
                                    q = s[0x1];
                                    switch ('quiz.' + s[0x2]) {
                                    case 'quiz.score':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['SCORE'];
                                    case 'quiz.score.total':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['TOTAL_SCORE'];
                                    case 'quiz.media.items.found':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_ITEMS_FOUND'];
                                    case 'quiz.media.item.count':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_ITEM_COUNT'];
                                    case 'quiz.media.questions.answered':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_QUESTIONS_ANSWERED'];
                                    case 'quiz.media.question.count':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_QUESTION_COUNT'];
                                    case 'quiz.questions.answered':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['QUESTIONS_ANSWERED'];
                                    case 'quiz.question.count':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['QUESTION_COUNT'];
                                    case 'quiz.items.found':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['ITEMS_FOUND'];
                                    case 'quiz.item.count':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['ITEM_COUNT'];
                                    case 'quiz.media.score':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_SCORE'];
                                    case 'quiz.media.score.total':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_TOTAL_SCORE'];
                                    }
                                }
                            }
                        }());
                    if (m)
                        return function () {
                            var r = this['get']('data')['quiz'];
                            if (r) {
                                if (!c) {
                                    if (q != undefined) {
                                        if (q == 'global') {
                                            var s = this['get']('data')['quizConfig'], t = s['objectives'];
                                            for (var u = 0x0, v = t['length']; u < v; ++u) {
                                                r['bind'](TDV['Quiz']['EVENT_OBJECTIVE_PROPERTIES_CHANGE'], h['call'](this, t[u]['id'], m), this);
                                            }
                                        } else
                                            r['bind'](TDV['Quiz']['EVENT_OBJECTIVE_PROPERTIES_CHANGE'], h['call'](this, q, m), this);
                                    } else
                                        r['bind'](TDV['Quiz']['EVENT_PROPERTIES_CHANGE'], g['call'](this, m), this);
                                    c = !![];
                                }
                                try {
                                    var w = 0x0;
                                    if (q != undefined) {
                                        if (q == 'global') {
                                            var s = this['get']('data')['quizConfig'], t = s['objectives'];
                                            for (var u = 0x0, v = t['length']; u < v; ++u) {
                                                w += r['getObjective'](t[u]['id'], m);
                                            }
                                        } else
                                            w = r['getObjective'](q, m);
                                    } else {
                                        w = r['get'](m);
                                        if (m == TDV['Quiz']['PROPERTY']['PANORAMA_INDEX'])
                                            w += 0x1;
                                    }
                                    return w;
                                } catch (x) {
                                    return undefined;
                                }
                            }
                        };
                }
            }
            break;
        }
        return function () {
            return '';
        };
    }
    function e() {
        var k = this['get']('data');
        k['updateText'](k['translateObjs'][a]);
    }
    function f(k) {
        var l = k['data']['nextSelectedIndex'];
        if (l >= 0x0) {
            var m = k['source']['get']('items')[l], n = function () {
                    m['unbind']('begin', n, this), e['call'](this);
                };
            m['bind']('begin', n, this);
        }
    }
    function g(k) {
        return function (l) {
            k in l && e['call'](this);
        }['bind'](this);
    }
    function h(k, l) {
        return function (m, n) {
            k == m && l in n && e['call'](this);
        }['bind'](this);
    }
    function i(k, l, m) {
        for (var n = 0x0; n < k['length']; ++n) {
            var o = k[n], p = o['get']('selectedIndex');
            if (p >= 0x0) {
                var q = l['split']('.'), r = o['get']('items')[p];
                if (m !== undefined && !m['call'](this, r))
                    continue;
                for (var s = 0x0; s < q['length']; ++s) {
                    if (r == undefined)
                        return '';
                    r = 'get' in r ? r['get'](q[s]) : r[q[s]];
                }
                return r;
            }
        }
        return '';
    }
    function j(k, l) {
        var m = l['get']('player');
        return m !== undefined && m['get']('viewerArea') == k;
    }
}
var script = {"scrollBarMargin":2,"width":"100%","scripts":{"clonePanoramaCamera":TDV.Tour.Script.clonePanoramaCamera,"startPanoramaWithModel":TDV.Tour.Script.startPanoramaWithModel,"getGlobalAudio":TDV.Tour.Script.getGlobalAudio,"cloneBindings":TDV.Tour.Script.cloneBindings,"quizResumeTimer":TDV.Tour.Script.quizResumeTimer,"updateMediaLabelFromPlayList":TDV.Tour.Script.updateMediaLabelFromPlayList,"setOverlaysVisibilityByTags":TDV.Tour.Script.setOverlaysVisibilityByTags,"clone":TDV.Tour.Script.clone,"copyToClipboard":TDV.Tour.Script.copyToClipboard,"setDirectionalPanoramaAudio":TDV.Tour.Script.setDirectionalPanoramaAudio,"openLink":TDV.Tour.Script.openLink,"setObjectsVisibilityByID":TDV.Tour.Script.setObjectsVisibilityByID,"setPanoramaCameraWithSpot":TDV.Tour.Script.setPanoramaCameraWithSpot,"getFirstPlayListWithMedia":TDV.Tour.Script.getFirstPlayListWithMedia,"copyObjRecursively":TDV.Tour.Script.copyObjRecursively,"setValue":TDV.Tour.Script.setValue,"startPanoramaWithCamera":TDV.Tour.Script.startPanoramaWithCamera,"setMeasurementsVisibility":TDV.Tour.Script.setMeasurementsVisibility,"setStartTimeVideo":TDV.Tour.Script.setStartTimeVideo,"quizShowQuestion":TDV.Tour.Script.quizShowQuestion,"takeScreenshot":TDV.Tour.Script.takeScreenshot,"setObjectsVisibility":TDV.Tour.Script.setObjectsVisibility,"getKey":TDV.Tour.Script.getKey,"getMediaByName":TDV.Tour.Script.getMediaByName,"getPixels":TDV.Tour.Script.getPixels,"downloadFile":TDV.Tour.Script.downloadFile,"showComponentsWhileMouseOver":TDV.Tour.Script.showComponentsWhileMouseOver,"updateDeepLink":TDV.Tour.Script.updateDeepLink,"historyGoBack":TDV.Tour.Script.historyGoBack,"pauseGlobalAudios":TDV.Tour.Script.pauseGlobalAudios,"getMediaByTags":TDV.Tour.Script.getMediaByTags,"getPlayListsWithMedia":TDV.Tour.Script.getPlayListsWithMedia,"startModel3DWithCameraSpot":TDV.Tour.Script.startModel3DWithCameraSpot,"executeAudioAction":TDV.Tour.Script.executeAudioAction,"stopGlobalAudios":TDV.Tour.Script.stopGlobalAudios,"existsKey":TDV.Tour.Script.existsKey,"historyGoForward":TDV.Tour.Script.historyGoForward,"openEmbeddedPDF":TDV.Tour.Script.openEmbeddedPDF,"setMainMediaByIndex":TDV.Tour.Script.setMainMediaByIndex,"getPlayListItems":TDV.Tour.Script.getPlayListItems,"triggerOverlay":TDV.Tour.Script.triggerOverlay,"cleanSelectedMeasurements":TDV.Tour.Script.cleanSelectedMeasurements,"getOverlays":TDV.Tour.Script.getOverlays,"resumePlayers":TDV.Tour.Script.resumePlayers,"quizShowScore":TDV.Tour.Script.quizShowScore,"setMainMediaByName":TDV.Tour.Script.setMainMediaByName,"getPlayListItemByMedia":TDV.Tour.Script.getPlayListItemByMedia,"htmlToPlainText":TDV.Tour.Script.htmlToPlainText,"unregisterKey":TDV.Tour.Script.unregisterKey,"showWindow":TDV.Tour.Script.showWindow,"setOverlayBehaviour":TDV.Tour.Script.setOverlayBehaviour,"quizShowTimeout":TDV.Tour.Script.quizShowTimeout,"playGlobalAudioWhilePlay":TDV.Tour.Script.playGlobalAudioWhilePlay,"playAudioList":TDV.Tour.Script.playAudioList,"init":TDV.Tour.Script.init,"toggleTextToSpeechComponent":TDV.Tour.Script.toggleTextToSpeechComponent,"getPlayListItemIndexByMedia":TDV.Tour.Script.getPlayListItemIndexByMedia,"registerKey":TDV.Tour.Script.registerKey,"executeAudioActionByTags":TDV.Tour.Script.executeAudioActionByTags,"pauseGlobalAudiosWhilePlayItem":TDV.Tour.Script.pauseGlobalAudiosWhilePlayItem,"pauseCurrentPlayers":TDV.Tour.Script.pauseCurrentPlayers,"assignObjRecursively":TDV.Tour.Script.assignObjRecursively,"getComponentsByTags":TDV.Tour.Script.getComponentsByTags,"getQuizTotalObjectiveProperty":TDV.Tour.Script.getQuizTotalObjectiveProperty,"setMediaBehaviour":TDV.Tour.Script.setMediaBehaviour,"shareSocial":TDV.Tour.Script.shareSocial,"setCameraSameSpotAsMedia":TDV.Tour.Script.setCameraSameSpotAsMedia,"getMainViewer":TDV.Tour.Script.getMainViewer,"autotriggerAtStart":TDV.Tour.Script.autotriggerAtStart,"executeJS":TDV.Tour.Script.executeJS,"setComponentsVisibilityByTags":TDV.Tour.Script.setComponentsVisibilityByTags,"getOverlaysByTags":TDV.Tour.Script.getOverlaysByTags,"quizFinish":TDV.Tour.Script.quizFinish,"setModel3DCameraSpot":TDV.Tour.Script.setModel3DCameraSpot,"getRootOverlay":TDV.Tour.Script.getRootOverlay,"initAnalytics":TDV.Tour.Script.initAnalytics,"changeBackgroundWhilePlay":TDV.Tour.Script.changeBackgroundWhilePlay,"executeFunctionWhenChange":TDV.Tour.Script.executeFunctionWhenChange,"setPanoramaCameraWithCurrentSpot":TDV.Tour.Script.setPanoramaCameraWithCurrentSpot,"showPopupPanoramaVideoOverlay":TDV.Tour.Script.showPopupPanoramaVideoOverlay,"playGlobalAudio":TDV.Tour.Script.playGlobalAudio,"changeOpacityWhilePlay":TDV.Tour.Script.changeOpacityWhilePlay,"textToSpeechComponent":TDV.Tour.Script.textToSpeechComponent,"initOverlayGroupRotationOnClick":TDV.Tour.Script.initOverlayGroupRotationOnClick,"quizStart":TDV.Tour.Script.quizStart,"cleanAllMeasurements":TDV.Tour.Script.cleanAllMeasurements,"textToSpeech":TDV.Tour.Script.textToSpeech,"initQuiz":TDV.Tour.Script.initQuiz,"mixObject":TDV.Tour.Script.mixObject,"quizPauseTimer":TDV.Tour.Script.quizPauseTimer,"changePlayListWithSameSpot":TDV.Tour.Script.changePlayListWithSameSpot,"setOverlaysVisibility":TDV.Tour.Script.setOverlaysVisibility,"toggleMeasurement":TDV.Tour.Script.toggleMeasurement,"_initSplitViewer":TDV.Tour.Script._initSplitViewer,"skip3DTransitionOnce":TDV.Tour.Script.skip3DTransitionOnce,"setComponentVisibility":TDV.Tour.Script.setComponentVisibility,"pauseGlobalAudio":TDV.Tour.Script.pauseGlobalAudio,"getAudioByTags":TDV.Tour.Script.getAudioByTags,"toggleVR":TDV.Tour.Script.toggleVR,"getOverlaysByGroupname":TDV.Tour.Script.getOverlaysByGroupname,"disableVR":TDV.Tour.Script.disableVR,"showPopupPanoramaOverlay":TDV.Tour.Script.showPopupPanoramaOverlay,"playGlobalAudioWhilePlayActiveMedia":TDV.Tour.Script.playGlobalAudioWhilePlayActiveMedia,"_initTwinsViewer":TDV.Tour.Script._initTwinsViewer,"createTween":TDV.Tour.Script.createTween,"sendAnalyticsData":TDV.Tour.Script.sendAnalyticsData,"getMediaFromPlayer":TDV.Tour.Script.getMediaFromPlayer,"stopMeasurement":TDV.Tour.Script.stopMeasurement,"setSurfaceSelectionHotspotMode":TDV.Tour.Script.setSurfaceSelectionHotspotMode,"isCardboardViewMode":TDV.Tour.Script.isCardboardViewMode,"restartTourWithoutInteraction":TDV.Tour.Script.restartTourWithoutInteraction,"getPlayListWithItem":TDV.Tour.Script.getPlayListWithItem,"syncPlaylists":TDV.Tour.Script.syncPlaylists,"isPanorama":TDV.Tour.Script.isPanorama,"_getObjectsByTags":TDV.Tour.Script._getObjectsByTags,"quizSetItemFound":TDV.Tour.Script.quizSetItemFound,"enableVR":TDV.Tour.Script.enableVR,"getActivePlayerWithViewer":TDV.Tour.Script.getActivePlayerWithViewer,"getComponentByName":TDV.Tour.Script.getComponentByName,"showPopupImage":TDV.Tour.Script.showPopupImage,"setMapLocation":TDV.Tour.Script.setMapLocation,"getPanoramaOverlayByName":TDV.Tour.Script.getPanoramaOverlayByName,"resumeGlobalAudios":TDV.Tour.Script.resumeGlobalAudios,"stopAndGoCamera":TDV.Tour.Script.stopAndGoCamera,"getActiveMediaWithViewer":TDV.Tour.Script.getActiveMediaWithViewer,"visibleComponentsIfPlayerFlagEnabled":TDV.Tour.Script.visibleComponentsIfPlayerFlagEnabled,"getMediaHeight":TDV.Tour.Script.getMediaHeight,"keepCompVisible":TDV.Tour.Script.keepCompVisible,"_initItemWithComps":TDV.Tour.Script._initItemWithComps,"getCurrentPlayerWithMedia":TDV.Tour.Script.getCurrentPlayerWithMedia,"_getPlayListsWithViewer":TDV.Tour.Script._getPlayListsWithViewer,"fixTogglePlayPauseButton":TDV.Tour.Script.fixTogglePlayPauseButton,"setObjectsVisibilityByTags":TDV.Tour.Script.setObjectsVisibilityByTags,"showPopupMedia":TDV.Tour.Script.showPopupMedia,"startMeasurement":TDV.Tour.Script.startMeasurement,"getActivePlayersWithViewer":TDV.Tour.Script.getActivePlayersWithViewer,"updateVideoCues":TDV.Tour.Script.updateVideoCues,"setModel3DCameraSequence":TDV.Tour.Script.setModel3DCameraSequence,"translate":TDV.Tour.Script.translate,"getMediaWidth":TDV.Tour.Script.getMediaWidth,"setEndToItemIndex":TDV.Tour.Script.setEndToItemIndex,"stopGlobalAudio":TDV.Tour.Script.stopGlobalAudio,"getPanoramaOverlaysByTags":TDV.Tour.Script.getPanoramaOverlaysByTags,"setStartTimeVideoSync":TDV.Tour.Script.setStartTimeVideoSync,"setMeasurementUnits":TDV.Tour.Script.setMeasurementUnits,"setPlayListSelectedIndex":TDV.Tour.Script.setPlayListSelectedIndex,"loadFromCurrentMediaPlayList":TDV.Tour.Script.loadFromCurrentMediaPlayList,"stopTextToSpeech":TDV.Tour.Script.stopTextToSpeech,"getCurrentPlayers":TDV.Tour.Script.getCurrentPlayers,"getModel3DInnerObject":TDV.Tour.Script.getModel3DInnerObject,"getStateTextToSpeech":TDV.Tour.Script.getStateTextToSpeech,"_initTTSTooltips":TDV.Tour.Script._initTTSTooltips,"toggleMeasurementsVisibility":TDV.Tour.Script.toggleMeasurementsVisibility,"setLocale":TDV.Tour.Script.setLocale},"defaultMenu":["fullscreen","mute","rotation"],"start":"this.init()","id":"rootPlayer","data":{"locales":{"es":"locale/es.txt"},"defaultLocale":"es","textToSpeechConfig":{"pitch":1,"speechOnInfoWindow":false,"volume":1,"speechOnTooltip":false,"speechOnQuizQuestion":false,"rate":1,"stopBackgroundAudio":false},"history":{},"displayTooltipInTouchScreens":true,"name":"Player536"},"scrollBarColor":"#000000","backgroundColor":["#FFFFFF"],"hash": "a73c0b7b02cba08e24883ac76d4d03a02b296c0699ba74cd8d4c7d62a000e000", "definitions": [{"initialSequence":"this.sequence_A9D6A9D3_A2D5_9E06_41C9_01C79E1A6785","enterPointingToHorizon":true,"id":"panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_camera","class":"PanoramaCamera","initialPosition":{"pitch":0,"class":"PanoramaCameraPosition","yaw":0}},{"id":"mainPlayList","items":[{"camera":"this.panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_camera","media":"this.panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0","class":"PanoramaPlayListItem","end":"this.trigger('tourEnded')","player":"this.MainViewerPanoramaPlayer"}],"class":"PlayList"},{"progressBarBorderRadius":2,"height":"100%","width":"100%","progressBarBorderSize":0,"toolTipFontFamily":"Arial","vrThumbstickRotationStep":20,"playbackBarBottom":5,"subtitlesFontColor":"#FFFFFF","subtitlesTextShadowOpacity":1,"playbackBarProgressBackgroundColorRatios":[0],"data":{"name":"Main Viewer"},"subtitlesTextShadowVerticalLength":1,"toolTipPaddingTop":4,"playbackBarBackgroundOpacity":1,"toolTipBorderColor":"#767676","playbackBarBackgroundColor":["#FFFFFF"],"propagateClick":false,"playbackBarBorderColor":"#FFFFFF","playbackBarHeight":10,"toolTipBackgroundColor":"#F6F6F6","playbackBarBorderRadius":0,"playbackBarHeadWidth":6,"vrPointerSelectionTime":2000,"progressBackgroundColorRatios":[0],"subtitlesBottom":50,"playbackBarHeadShadowBlurRadius":3,"subtitlesTextShadowHorizontalLength":1,"playbackBarLeft":0,"progressHeight":2,"toolTipFontColor":"#606060","playbackBarHeadHeight":15,"progressLeft":"33%","toolTipFontSize":"1.11vmin","vrPointerColor":"#FFFFFF","playbackBarProgressBorderSize":0,"playbackBarProgressBorderColor":"#000000","subtitlesTop":0,"subtitlesTextShadowColor":"#000000","id":"MainViewer","playbackBarBackgroundColorDirection":"vertical","toolTipPaddingLeft":6,"progressRight":"33%","subtitlesFontSize":"3vmin","progressOpacity":0.7,"playbackBarHeadBackgroundColorRatios":[0,1],"subtitlesBackgroundOpacity":0.2,"progressBarBorderColor":"#000000","playbackBarHeadShadowColor":"#000000","playbackBarHeadBorderRadius":0,"progressBarBackgroundColorRatios":[0],"playbackBarHeadBorderSize":0,"firstTransitionDuration":0,"surfaceReticleColor":"#FFFFFF","playbackBarHeadShadow":true,"progressBarBackgroundColorDirection":"horizontal","class":"ViewerArea","subtitlesBorderColor":"#FFFFFF","minHeight":50,"minWidth":100,"playbackBarHeadBorderColor":"#000000","toolTipShadowColor":"#333138","playbackBarHeadBackgroundColor":["#111111","#666666"],"playbackBarProgressBorderRadius":0,"progressBorderRadius":2,"toolTipPaddingBottom":4,"playbackBarBorderSize":0,"playbackBarRight":0,"playbackBarProgressBackgroundColor":["#3399FF"],"progressBorderColor":"#000000","progressBorderSize":0,"toolTipPaddingRight":6,"subtitlesFontFamily":"Arial","progressBottom":10,"progressBarBackgroundColor":["#3399FF"],"playbackBarHeadShadowOpacity":0.7,"subtitlesGap":0,"toolTipTextShadowColor":"#000000","surfaceReticleSelectionColor":"#FFFFFF","subtitlesBackgroundColor":"#000000","progressBackgroundColor":["#000000"],"vrPointerSelectionColor":"#FF6600"},{"pitch":-28.18,"class":"Panorama","hfovMax":130,"label":trans('panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0.label'),"vfov":122.62,"data":{"label":"panoramica 2"},"hfov":360,"id":"panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0","frames":[{"left":{"class":"ImageResource","levels":[{"rowCount":13,"height":6656,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/l/0/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":13,"width":6656},{"rowCount":7,"height":3584,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/l/1/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":7,"width":3584},{"rowCount":4,"height":2048,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/l/2/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":4,"width":2048},{"rowCount":2,"height":1024,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/l/3/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":2,"width":1024},{"rowCount":1,"height":512,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/l/4/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":["ondemand","preload"],"colCount":1,"width":512}]},"bottom":{"class":"ImageResource","levels":[{"rowCount":13,"height":6656,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/d/0/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":13,"width":6656},{"rowCount":7,"height":3584,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/d/1/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":7,"width":3584},{"rowCount":4,"height":2048,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/d/2/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":4,"width":2048},{"rowCount":2,"height":1024,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/d/3/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":2,"width":1024},{"rowCount":1,"height":512,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/d/4/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":["ondemand","preload"],"colCount":1,"width":512}]},"front":{"class":"ImageResource","levels":[{"rowCount":13,"height":6656,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/f/0/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":13,"width":6656},{"rowCount":7,"height":3584,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/f/1/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":7,"width":3584},{"rowCount":4,"height":2048,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/f/2/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":4,"width":2048},{"rowCount":2,"height":1024,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/f/3/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":2,"width":1024},{"rowCount":1,"height":512,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/f/4/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":["ondemand","preload"],"colCount":1,"width":512}]},"class":"CubicPanoramaFrame","thumbnailUrl":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_t.webp","back":{"class":"ImageResource","levels":[{"rowCount":13,"height":6656,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/b/0/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":13,"width":6656},{"rowCount":7,"height":3584,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/b/1/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":7,"width":3584},{"rowCount":4,"height":2048,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/b/2/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":4,"width":2048},{"rowCount":2,"height":1024,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/b/3/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":2,"width":1024},{"rowCount":1,"height":512,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/b/4/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":["ondemand","preload"],"colCount":1,"width":512}]},"right":{"class":"ImageResource","levels":[{"rowCount":13,"height":6656,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/r/0/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":13,"width":6656},{"rowCount":7,"height":3584,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/r/1/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":7,"width":3584},{"rowCount":4,"height":2048,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/r/2/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":4,"width":2048},{"rowCount":2,"height":1024,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/r/3/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","colCount":2,"width":1024},{"rowCount":1,"height":512,"url":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_0/r/4/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":["ondemand","preload"],"colCount":1,"width":512}]}}],"thumbnailUrl":"media/panorama_A9011CBE_A2D5_B67E_41D6_1C74FF319BB0_t.webp"},{"id":"MainViewerPanoramaPlayer","keepModel3DLoadedWithoutLocation":true,"class":"PanoramaPlayer","mouseControlMode":"drag_rotation","aaEnabled":true,"displayPlaybackBar":true,"arrowKeysAction":"translate","touchControlMode":"drag_rotation","viewerArea":"this.MainViewer"},{"movements":[{"yawDelta":18.5,"class":"DistancePanoramaCameraMovement","easing":"cubic_in","yawSpeed":7.96},{"yawDelta":323,"class":"DistancePanoramaCameraMovement","yawSpeed":7.96},{"yawDelta":18.5,"class":"DistancePanoramaCameraMovement","easing":"cubic_out","yawSpeed":7.96}],"class":"PanoramaCameraSequence","id":"sequence_A9D6A9D3_A2D5_9E06_41C9_01C79E1A6785"}],"layout":"absolute","propagateClick":false,"backgroundColorRatios":[0],"class":"Player","minHeight":0,"minWidth":0,"watermark":false,"height":"100%","gap":10,"children":["this.MainViewer"]};
if (script['data'] == undefined)
    script['data'] = {};
script['data']['translateObjs'] = translateObjs, script['data']['createQuizConfig'] = function () {
    var a = {};
    return this['get']('data')['translateObjs'] = translateObjs, a;
}, TDV['PlayerAPI']['defineScript'](script);
//# sourceMappingURL=script_device.js.map
})();
//Generated with v2025.0.6, Tue Nov 3 2026
//