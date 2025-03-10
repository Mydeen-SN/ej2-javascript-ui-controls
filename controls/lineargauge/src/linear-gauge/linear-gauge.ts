/* eslint-disable valid-jsdoc */
import { Component, Property, NotifyPropertyChanges, Internationalization, ModuleDeclaration, isBlazor } from '@syncfusion/ej2-base';
import { EmitType, INotifyPropertyChanged, setCulture, Browser, resetBlazorTemplate } from '@syncfusion/ej2-base';
import { Event, EventHandler, Complex, Collection, isNullOrUndefined, remove, createElement } from '@syncfusion/ej2-base';
import { Border, Font, Container, Margin, Annotation, TooltipSettings } from './model/base';
import { FontModel, BorderModel, ContainerModel, MarginModel, AnnotationModel, TooltipSettingsModel } from './model/base-model';
import { AxisModel } from './axes/axis-model';
import { Axis, Pointer } from './axes/axis';
import { load, loaded, gaugeMouseMove, gaugeMouseLeave, gaugeMouseDown, gaugeMouseUp, resized, valueChange } from './model/constant';
import { LinearGaugeModel } from './linear-gauge-model';
import { ILoadedEventArgs, ILoadEventArgs, IAnimationCompleteEventArgs, IAnnotationRenderEventArgs } from './model/interface';
import { ITooltipRenderEventArgs, IVisiblePointer, IMouseEventArgs, IAxisLabelRenderEventArgs, IMoveCursor } from './model/interface';
import { IResizeEventArgs, IValueChangeEventArgs, IThemeStyle, IPrintEventArgs, IPointerDragEventArgs } from './model/interface';
import { Size, valueToCoefficient, calculateShapes, stringToNumber, removeElement, getElement, VisibleRange } from './utils/helper';
import { measureText, Rect, TextOption, textElement, GaugeLocation, RectOption, PathOption } from './utils/helper';
import { getBox, withInRange, getPointer, convertPixelToValue, isPointerDrag } from './utils/helper';
import { Orientation, LinearGaugeTheme, LabelPlacement } from './utils/enum';
import { dragEnd, dragMove, dragStart } from './model/constant';
import { AxisLayoutPanel } from './axes/axis-panel';
import { SvgRenderer } from '@syncfusion/ej2-svg-base';
import { AxisRenderer } from './axes/axis-renderer';
import { Annotations } from './annotations/annotations';
import { GaugeTooltip } from './user-interaction/tooltip';
import { getThemeStyle } from './model/theme';
import { PdfPageOrientation } from '@syncfusion/ej2-pdf-export';
import { ExportType } from '../linear-gauge/utils/enum';
import { Print } from './model/print';
import { PdfExport } from './model/pdf-export';
import { ImageExport } from './model/image-export';
import { Gradient } from './axes/gradient';

/**
 * Represents the EJ2 Linear gauge control.
 * ```html
 * <div id="container"/>
 * <script>
 *   var gaugeObj = new LinearGauge({ });
 *   gaugeObj.appendTo("#container");
 * </script>
 * ```
 */
@NotifyPropertyChanges
export class LinearGauge extends Component<HTMLElement> implements INotifyPropertyChanged {
    //Module declaration for gauge
    /**
     * Specifies the module that is used to place any text or images as annotation into the linear gauge.
     */
    public annotationsModule: Annotations;

    /**
     * Specifies the module that is used to display the pointer value in tooltip.
     */
    public tooltipModule: GaugeTooltip;

    /**
     * This module enables the print functionality in linear gauge control.
     *
     * @private
     */
    public printModule: Print;

    /**
     * This module enables the export to PDF functionality in linear gauge control.
     *
     * @private
     */
    public pdfExportModule: PdfExport;

    /**
     * This module enables the export to image functionality in linear gauge control.
     *
     * @private
     */
    public imageExportModule: ImageExport;

    /**
     * This module enables the gradient option for pointer and ranges.
     *
     * @private
     */
    public gradientModule: Gradient;

    /**
     * Specifies the gradient count of the linear gauge.
     *
     * @private
     */
    public gradientCount: number = 0;

    /**
     * Specifies the width of the linear gauge as a string in order to provide input as both like '100px' or '100%'.
     * If specified as '100%, gauge will render to the full width of its parent element.
     *
     * @default null
     */

    @Property(null)
    public width: string;

    /**
     * Enables or disables the gauge to be rendered to the complete width.
     *
     * @default true
     */
    @Property(true)
    public allowMargin: boolean;

    /**
     * Specifies the height of the linear gauge as a string in order to provide input as both like '100px' or '100%'.
     * If specified as '100%, gauge will render to the full height of its parent element.
     *
     * @default null
     */

    @Property(null)
    public height: string;

    /**
     * Specifies the orientation of the rendering of the linear gauge.
     *
     * @default Vertical
     */
    @Property('Vertical')
    public orientation: Orientation;

    /**
     * Specifies the placement of the label in linear gauge.
     *
     * @default None
     */
    @Property('None')
    public edgeLabelPlacement: LabelPlacement;

    /**
     * Enables or disables the print functionality in linear gauge.
     *
     * @default false
     */
    @Property(false)
    public allowPrint: boolean;

    /**
     * Enables or disables the export to image functionality in linear gauge.
     *
     * @default false
     */
    @Property(false)
    public allowImageExport: boolean;

    /**
     * Enables or disables the export to PDF functionality in linear gauge.
     *
     * @default false
     */
    @Property(false)
    public allowPdfExport: boolean;

    /**
     * Specifies the options to customize the margins of the linear gauge.
     */

    @Complex<MarginModel>({}, Margin)
    public margin: MarginModel;

    /**
     * Specifies the options for customizing the color and width of the border for linear gauge.
     */

    @Complex<BorderModel>({ color: '', width: 0 }, Border)
    public border: BorderModel;

    /**
     * Specifies the background color of the gauge. This property accepts value in hex code, rgba string as a valid CSS color string.
     *
     * @default 'transparent'
     */
    @Property(null)
    public background: string;

    /**
     * Specifies the title for linear gauge.
     */

    @Property('')
    public title: string;

    /**
     * Specifies the options for customizing the appearance of title for linear gauge.
     */

    @Complex<FontModel>({ size: '15px', color: null, fontStyle: null, fontWeight: null }, Font)
    public titleStyle: FontModel;

    /**
     * Specifies the options for customizing the container in linear gauge.
     */

    @Complex<ContainerModel>({}, Container)
    public container: ContainerModel;

    /**
     * Specifies the options for customizing the axis in linear gauge.
     */

    @Collection<AxisModel>([{}], Axis)
    public axes: AxisModel[];

    /**
     * Specifies the options for customizing the tooltip in linear gauge.
     */

    @Complex<TooltipSettingsModel>({}, TooltipSettings)
    public tooltip: TooltipSettingsModel;

    /**
     * Specifies the options for customizing the annotation of linear gauge.
     */
    @Collection<AnnotationModel>([{}], Annotation)
    public annotations: AnnotationModel[];

    /**
     * Specifies the color palette for axis ranges in linear gauge.
     *
     * @default []
     */
    @Property([])
    public rangePalettes: string[];

    /**
     * Enables or disables a grouping separator should be used for a number.
     *
     * @default false
     */
    @Property(false)
    public useGroupingSeparator: boolean;

    /**
     * Specifies the description for linear gauge.
     *
     * @default null
     */
    @Property(null)
    public description: string;

    /**
     * Specifies the tab index value for the linear gauge.
     *
     * @default 1
     */
    @Property(1)
    public tabIndex: number;

    /**
     * Specifies the format to apply for internationalization in linear gauge.
     *
     * @default null
     */
    @Property(null)
    public format: string;

    /**
     * Specifies the theme supported for the linear gauge.
     *
     * @default Material
     */
    @Property('Material')
    public theme: LinearGaugeTheme;

    /**
     * Triggers after the gauge gets rendered.
     *
     * @event
     * @blazorProperty 'Loaded'
     */
    @Event()
    public loaded: EmitType<ILoadedEventArgs>;

    /**
     * Triggers before the gauge gets rendered.
     *
     * @event
     * @blazorProperty 'OnLoad'
     */
    @Event()
    public load: EmitType<ILoadEventArgs>;

    /**
     * Triggers after completing the animation for pointer.
     *
     * @event
     * @blazorProperty 'AnimationCompleted'
     */
    @Event()
    public animationComplete: EmitType<IAnimationCompleteEventArgs>;

    /**
     * Triggers before each axis label gets rendered.
     *
     * @event
     * @blazorProperty 'AxisLabelRendering'
     */
    @Event()
    public axisLabelRender: EmitType<IAxisLabelRenderEventArgs>;

    /**
     * Triggers before the pointer is dragged.
     *
     * @event
     * @blazorProperty 'OnDragStart'
     */

    @Event()
    public dragStart: EmitType<IPointerDragEventArgs>;

    /**
     * Triggers while dragging the pointers.
     *
     * @event
     * @blazorProperty 'OnDragMove'
     */

    @Event()
    public dragMove: EmitType<IPointerDragEventArgs>;

    /**
     * Triggers after the pointer is dragged.
     *
     * @event
     * @blazorProperty 'OnDragEnd'
     */
    @Event()
    public dragEnd: EmitType<IPointerDragEventArgs>;

    /**
     * Triggers before each annotation gets rendered.
     *
     * @event
     * @blazorProperty 'AnnotationRendering'
     */
    @Event()
    public annotationRender: EmitType<IAnnotationRenderEventArgs>;

    /**
     * Triggers before the tooltip get rendered.
     *
     * @event
     * @deprecated
     * @blazorProperty 'TooltipRendering'
     */

    @Event()
    public tooltipRender: EmitType<ITooltipRenderEventArgs>;

    /**
     * Triggers when performing the mouse move operation on gauge area.
     *
     * @event
     * @blazorProperty 'OnGaugeMouseMove'
     */

    @Event()
    public gaugeMouseMove: EmitType<IMouseEventArgs>;


    /**
     * Triggers when performing the mouse leave operation from the gauge area.
     *
     * @event
     * @blazorProperty 'OnGaugeMouseLeave'
     */

    @Event()
    public gaugeMouseLeave: EmitType<IMouseEventArgs>;

    /**
     * Triggers when performing the mouse down operation on gauge area.
     *
     * @event
     * @blazorProperty 'OnGaugeMouseDown'
     */

    @Event()
    public gaugeMouseDown: EmitType<IMouseEventArgs>;

    /**
     * Triggers when performing mouse up operation on gauge area.
     *
     * @event
     * @blazorProperty 'OnGaugeMouseUp'
     */

    @Event()
    public gaugeMouseUp: EmitType<IMouseEventArgs>;

    /**
     * Triggers while changing the value of the pointer by UI interaction.
     *
     * @event
     * @blazorProperty 'ValueChange'
     */

    @Event()
    public valueChange: EmitType<IValueChangeEventArgs>;

    /**
     * Triggers after window resize.
     *
     * @event
     * @blazorProperty 'Resizing'
     */

    @Event()
    public resized: EmitType<IResizeEventArgs>;

    /**
     * Triggers before the prints gets started.
     *
     * @event
     * @blazorProperty 'OnPrint'
     */

    @Event()
    public beforePrint: EmitType<IPrintEventArgs>;

    /** @private */
    public activePointer: Pointer;
    /** @private */
    public activeAxis: Axis;
    /** @private */
    public renderer: SvgRenderer;
    /** @private */
    public svgObject: Element;
    /** @private */
    public availableSize: Size;
    /** @private */
    public actualRect: Rect;
    /** @private */
    public intl: Internationalization;
    /** @private* */
    public containerBounds: Rect;
    /** @private */
    public isTouch: boolean;
    /** @private */
    public isDrag: boolean = false;
    /**
     * @private
     * Calculate the axes bounds for gauge.
     * @hidden
     */
    public gaugeAxisLayoutPanel: AxisLayoutPanel;
    /**
     * @private
     * Render the axis elements for gauge.
     * @hidden
     */
    public axisRenderer: AxisRenderer;

    /** @private */
    private resizeTo: number;

    /** @private */
    public containerObject: Element;

    /** @private */
    public pointerDrag: boolean = false;

    /** @private */
    public mouseX: number = 0;

    /** @private */
    public mouseY: number = 0;

    /** @private */
    public mouseElement: Element;

    /** @private */
    public gaugeResized: boolean = false;

    /** @private */
    public nearSizes: number[];

    /** @private */
    public farSizes: number[];

    /**
     * @private
     */
    public themeStyle: IThemeStyle;

    /** @private */
    public isBlazor: boolean;

    /**
     * @private
     * Constructor for creating the widget
     * @hidden
     */

    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    constructor(options?: LinearGaugeModel, element?: string | HTMLElement) {
        super(options, element);
    }

    /**
     * Initialize the preRender method.
     */

    protected preRender(): void {
        this.isBlazor = isBlazor();
        this.unWireEvents();
        this.trigger(load, { gauge: !this.isBlazor ? this : null });
        this.initPrivateVariable();
        this.setCulture();
        this.createSvg();
        this.wireEvents();

    }
    private setTheme(): void {

        this.themeStyle = getThemeStyle(this.theme);

    }

    private initPrivateVariable(): void {
        if (this.element.id === '') {
            const collection: number = document.getElementsByClassName('e-lineargauge').length;
            this.element.id = 'lineargauge_' + 'control_' + collection;
        }
        this.renderer = new SvgRenderer(this.element.id);
        this.gaugeAxisLayoutPanel = new AxisLayoutPanel(this);
        this.axisRenderer = new AxisRenderer(this);
    }

    /**
     * Method to set culture for chart
     */
    private setCulture(): void {
        this.intl = new Internationalization();
    }

    /**
     * Methods to create svg element
     */
    private createSvg(): void {
        this.removeSvg();
        this.calculateSize();
        this.svgObject = this.renderer.createSvg({
            id: this.element.id + '_svg',
            width: this.availableSize.width,
            height: this.availableSize.height
        });
    }

    /**
     * To Remove the SVG.
     *
     * @return {boolean}
     * @private
     */

    public removeSvg(): void {
        for (let i: number = 0; i < this.annotations.length; i++) {
            resetBlazorTemplate(this.element.id + '_ContentTemplate' + i, 'ContentTemplate');
        }
        removeElement(this.element.id + '_Secondary_Element');
        if (!(isNullOrUndefined(this.svgObject)) && !isNullOrUndefined(this.svgObject.parentNode)) {
            remove(this.svgObject);
        }
        this.clearTemplate();
    }

    /**
     * Method to calculate the size of the gauge
     */
    private calculateSize(): void {
        const width: number = stringToNumber(this.width, this.element.offsetWidth) || this.element.offsetWidth || 600;
        const height: number = stringToNumber(this.height, this.element.offsetHeight) || this.element.offsetHeight || 450;
        this.availableSize = new Size(width, height);
    }

    /**
     * To Initialize the control rendering
     */
    protected render(): void {
        this.setTheme();
        this.renderGaugeElements();
        this.calculateBounds();
        this.renderAxisElements();
        this.renderComplete();
    }

    /**
     * @private
     * To render the gauge elements
     */
    public renderGaugeElements(): void {
        this.appendSecondaryElement();
        this.renderBorder();
        this.renderTitle();
        this.renderContainer();
    }

    private appendSecondaryElement(): void {
        if (isNullOrUndefined(getElement(this.element.id + '_Secondary_Element'))) {
            const secondaryElement: Element = createElement('div');
            secondaryElement.id = this.element.id + '_Secondary_Element';
            secondaryElement.setAttribute('style', 'position: relative');
            this.element.appendChild(secondaryElement);
        }
    }

    /**
     * Render the map area border
     */
    private renderArea(): void {
        const size: Size = measureText(this.title, this.titleStyle);
        const rectSize: Rect = new Rect(
            this.actualRect.x, this.actualRect.y - (size.height / 2), this.actualRect.width, this.actualRect.height);
        const rect: RectOption = new RectOption(
            this.element.id + 'LinearGaugeBorder', this.background || this.themeStyle.backgroundColor, this.border, 1, rectSize);
        this.svgObject.appendChild(this.renderer.drawRectangle(rect) as SVGRectElement);
    }
    /**
     * @private
     * To calculate axes bounds
     */
    public calculateBounds(): void {
        this.gaugeAxisLayoutPanel.calculateAxesBounds();
    }

    /**
     * @private
     * To render axis elements
     */
    public renderAxisElements(): void {
        this.axisRenderer.renderAxes();
        this.element.appendChild(this.svgObject);
        if (this.annotationsModule) {
            this.annotationsModule.renderAnnotationElements();
        }
        this.trigger(loaded, { gauge: !this.isBlazor ? this : null });
        removeElement('gauge-measuretext');
    }

    private renderBorder(): void {
        const width: number = this.border.width;
        if (width > 0 || (this.background || this.themeStyle.backgroundColor)) {
            const rect: RectOption = new RectOption(
                this.element.id + '_LinearGaugeBorder', this.background || this.themeStyle.backgroundColor, this.border, 1,
                new Rect(width / 2, width / 2, this.availableSize.width - width, this.availableSize.height - width), null, null);
            this.svgObject.appendChild(this.renderer.drawRectangle(rect) as HTMLElement);
        }
    }

    private renderTitle(): void {
        const size: Size = measureText(this.title, this.titleStyle);
        const options: TextOption = new TextOption(
            this.element.id + '_LinearGaugeTitle',
            this.availableSize.width / 2,
            this.margin.top + (size.height / 2),
            'middle', this.title
        );
        const titleBounds: Rect = {
            x: options.x - (size.width / 2),
            y: options.y,
            width: size.width,
            height: size.height
        };
        const x: number = this.margin.left;
        const y: number = (isNullOrUndefined(titleBounds)) ? this.margin.top : titleBounds.y;
        const height: number = (this.availableSize.height - y - this.margin.bottom);
        const width: number = (this.availableSize.width - this.margin.left - this.margin.right);
        this.actualRect = { x: x, y: y, width: width, height: height };
        if (this.title) {
            this.titleStyle.fontFamily = this.themeStyle.fontFamily || this.titleStyle.fontFamily;
            this.titleStyle.size = this.themeStyle.fontSize || this.titleStyle.size;
            this.titleStyle.fontStyle = this.titleStyle.fontStyle || this.themeStyle.titleFontStyle;
            this.titleStyle.fontWeight = this.titleStyle.fontWeight || this.themeStyle.titleFontWeight;
            const element: Element = textElement(
                options, this.titleStyle, this.titleStyle.color || this.themeStyle.titleFontColor, this.svgObject
            );
            element.setAttribute('aria-label', this.description || this.title);
            element.setAttribute('tabindex', this.tabIndex.toString());
        }
    }

    /*
     * Method to unbind the gauge events
     */
    private unWireEvents(): void {
        EventHandler.remove(this.element, Browser.touchStartEvent, this.gaugeOnMouseDown);
        EventHandler.remove(this.element, Browser.touchMoveEvent, this.mouseMove);
        EventHandler.remove(this.element, Browser.touchEndEvent, this.mouseEnd);
        EventHandler.remove(this.element, 'contextmenu', this.gaugeRightClick);
        EventHandler.remove(
            this.element, (Browser.isPointer ? 'pointerleave' : 'mouseleave'),
            this.mouseLeave
        );
        EventHandler.remove(
            <HTMLElement & Window>window,
            (Browser.isTouch && ('orientation' in window && 'onorientationchange' in window)) ? 'orientationchange' : 'resize',
            this.gaugeResize.bind(this)
        );
    }

    /*
     * Method to bind the gauge events
     */

    private wireEvents(): void {
        /*! Bind the Event handler */
        EventHandler.add(this.element, Browser.touchStartEvent, this.gaugeOnMouseDown, this);
        EventHandler.add(this.element, Browser.touchMoveEvent, this.mouseMove, this);
        EventHandler.add(this.element, Browser.touchEndEvent, this.mouseEnd, this);
        EventHandler.add(this.element, 'contextmenu', this.gaugeRightClick, this);
        EventHandler.add(
            this.element,
            (Browser.isPointer ? 'pointerleave' : 'mouseleave'), this.mouseLeave, this
        );
        EventHandler.add(
            <HTMLElement & Window>window,
            (Browser.isTouch && ('orientation' in window && 'onorientationchange' in window)) ? 'orientationchange' : 'resize',
            this.gaugeResize, this
        );
        this.setStyle(<HTMLElement>this.element);
    }

    private setStyle(element: HTMLElement): void {
        element.style.touchAction = isPointerDrag(this.axes) ? 'none' : 'element';
        element.style.msTouchAction = isPointerDrag(this.axes) ? 'none' : 'element';
        element.style.msContentZooming = 'none';
        element.style.msUserSelect = 'none';
        element.style.webkitUserSelect = 'none';
        element.style.position = 'relative';
    }

    /**
     * Handles the gauge resize.
     *
     * @return {boolean}
     * @private
     */
    public gaugeResize(e: Event): boolean {
        const args: IResizeEventArgs = {
            gauge: !this.isBlazor ? this : null,
            previousSize: new Size(
                this.availableSize.width,
                this.availableSize.height
            ),
            name: resized,
            currentSize: new Size(0, 0)
        };
        if (this.resizeTo) {
            clearTimeout(this.resizeTo);
        }
        if (!isNullOrUndefined(this.element) && this.element.classList.contains('e-lineargauge')) {
            this.resizeTo = window.setTimeout(
                (): void => {
                    this.createSvg();
                    this.renderGaugeElements();
                    this.calculateBounds();
                    this.renderAxisElements();
                    args.currentSize = new Size(this.availableSize.width, this.availableSize.height);
                    this.trigger(resized, args);
                    this.render();
                },
                500);
        }
        return false;
    }

    /**
     * To destroy the gauge element from the DOM.
     */
    public destroy(): void {
        this.unWireEvents();
        this.removeSvg();
        super.destroy();
    }

    /**
     * @private
     * To render the gauge container
     */
    public renderContainer(): void {
        let width: number; let height: number; let x: number; let y: number;
        let options: PathOption;
        const labelPadding: number = 20;
        let path: string = '';
        const fill: string = (this.container.backgroundColor !== 'transparent'
            || (this.theme !== 'Bootstrap4' && this.theme !== 'Material'))
            ? this.container.backgroundColor : this.themeStyle.containerBackground;
        let rect: RectOption;
        const radius: number = this.container.width;
        const bottomRadius: number = radius + ((radius / 2) / Math.PI);
        const topRadius: number = radius / 2;
        let allowContainerRender: boolean = false;
        for (let i = 0; i < this.axes.length; i++) {
            if (this.axes[i].minimum !== this.axes[i].maximum) {
                allowContainerRender = true;
                break;
            }
        }
        if (this.orientation === 'Vertical') {
            height = this.actualRect.height;
            height = (this.container.height > 0 ? this.container.height : ((height / 2) - ((height / 2) / 4)) * 2);
            width = this.container.width;
            height = (this.container.type === 'Thermometer') ? height - (bottomRadius * 2) - topRadius : height;
            x = (this.actualRect.x + ((this.actualRect.width / 2) - (this.container.width / 2))) + this.container.offset;
            y = this.actualRect.y + ((this.actualRect.height / 2) - ((this.container.type === 'Thermometer') ?
                ((height + (bottomRadius * 2) - topRadius)) / 2 : height / 2));
        } else {
            if (this.allowMargin) {
                width = (this.container.height > 0) ? this.container.height :
                    ((this.actualRect.width / 2) - ((this.actualRect.width / 2) / 4)) * 2;
                width = (this.container.type === 'Thermometer') ? width - (bottomRadius * 2) - topRadius : width;
            } else {
                width = this.actualRect.width - labelPadding;
                width = (this.container.type === 'Thermometer') ? (this.actualRect.width - (bottomRadius * 2) - topRadius) : width;
            }
            x = this.actualRect.x + ((this.actualRect.width / 2) - ((this.container.type === 'Thermometer') ?
                (width - (bottomRadius * 2) + topRadius) / 2 : width / 2));
            y = (this.actualRect.y + ((this.actualRect.height / 2) - (this.container.width / 2))) + this.container.offset;
            height = this.container.width;
        }
        this.containerBounds = (!allowContainerRender) ? { x: 0, y: 0, width: 0, height: 0 } : { x: x, y: y, width: width, height: height };
        if (this.containerBounds.width > 0) {
            this.containerObject = this.renderer.createGroup({ id: this.element.id + '_Container_Group', transform: 'translate( 0, 0)' });
            if (this.container.type === 'Normal') {
                let containerBorder: BorderModel = { color: this.container.border.color || this.themeStyle.containerBorderColor,
                    width: this.container.border.width };
                rect = new RectOption(
                    this.element.id + '_' + this.container.type + '_Layout', fill, containerBorder, 1,
                    new Rect(x, y, width, height));
                this.containerObject.appendChild(this.renderer.drawRectangle(rect));
            } else {
                path = getBox(
                    this.containerBounds, this.container.type, this.orientation,
                    new Size(this.container.height, this.container.width), 'container', null, null, this.container.roundedCornerRadius);
                options = new PathOption(
                    this.element.id + '_' + this.container.type + '_Layout', fill,
                    this.container.border.width, this.container.border.color || this.themeStyle.containerBorderColor, 1, '', path);
                this.containerObject.appendChild(this.renderer.drawPath(options) as SVGAElement);
            }
            this.svgObject.appendChild(this.containerObject);
        }
    }

    /**
     * Method to set mouse x, y from events
     */
    private setMouseXY(e: PointerEvent): void {
        let pageX: number;
        let pageY: number;
        const svgRect: ClientRect = getElement(this.element.id + '_svg').getBoundingClientRect();
        const rect: ClientRect = this.element.getBoundingClientRect();
        if (e.type.indexOf('touch') > -1) {
            this.isTouch = true;
            const touchArg: TouchEvent = <TouchEvent & PointerEvent>e;
            pageY = touchArg.changedTouches[0].clientY;
            pageX = touchArg.changedTouches[0].clientX;
        } else {
            this.isTouch = e.pointerType === 'touch' || e.pointerType === '2';
            pageX = e.clientX;
            pageY = e.clientY;
        }
        this.mouseY = (pageY - rect.top) - Math.max(svgRect.top - rect.top, 0);
        this.mouseX = (pageX - rect.left) - Math.max(svgRect.left - rect.left, 0);
    }
    /**
     * Handles the mouse down on gauge.
     *
     * @return {boolean}
     * @private
     */
    public gaugeOnMouseDown(e: PointerEvent): boolean {
        let pageX: number; let pageY: number;
        let target: Element;
        const element: Element = <Element>e.target;
        const split: string[] = [];
        const clientRect: ClientRect = this.element.getBoundingClientRect();
        let axis: Axis; const isPointer: boolean = false;
        let pointer: Pointer;
        let current: IMoveCursor;
        let currentPointer: IVisiblePointer;
        this.setMouseXY(e);
        let top: number; let left: number;
        let pointerElement: Element; let svgPath: SVGPathElement;
        const dragProcess: boolean = false;
        const args: IMouseEventArgs = this.getMouseArgs(e, 'touchstart', gaugeMouseDown);
        this.trigger(gaugeMouseDown, args, (observedArgs: IMouseEventArgs) => {
            this.mouseX = args.x;
            this.mouseY = args.y;
            if (args.target) {
                if (!args.cancel && ((args.target.id.indexOf('MarkerPointer') > -1) || (args.target.id.indexOf('BarPointer') > -1))) {
                    current = this.moveOnPointer(args.target as HTMLElement);
                    currentPointer = getPointer(args.target as HTMLElement, this);
                    this.activeAxis = <Axis>this.axes[currentPointer.axisIndex];
                    this.activePointer = <Pointer>this.activeAxis.pointers[currentPointer.pointerIndex];
                    if (isNullOrUndefined(this.activePointer.pathElement)) {
                        this.activePointer.pathElement = [e.target as Element];
                    }
                    const pointInd: number = parseInt(this.activePointer.pathElement[0].id.slice(-1), 10);
                    const axisInd: number = parseInt(this.activePointer.pathElement[0].id.match(/\d/g)[0], 10);
                    if (currentPointer.pointer.enableDrag) {
                        this.trigger(dragStart, this.isBlazor ? {
                            name: dragStart,
                            currentValue: this.activePointer.currentValue,
                            pointerIndex: pointInd,
                            axisIndex: axisInd
                        } as IPointerDragEventArgs : {
                            axis: this.activeAxis,
                            name: dragStart,
                            pointer: this.activePointer,
                            currentValue: this.activePointer.currentValue,
                            pointerIndex: pointInd,
                            axisIndex: axisInd
                        } as IPointerDragEventArgs);
                    }
                    if (!isNullOrUndefined(current) && current.pointer) {
                        this.pointerDrag = true;
                        this.mouseElement = args.target;
                        this.svgObject.setAttribute('cursor', current.style);
                        this.mouseElement.setAttribute('cursor', current.style);
                    }
                }
            }
        });
        return false;
    }

    /**
     * Handles the mouse move.
     *
     * @return {boolean}
     * @private
     */
    public mouseMove(e: PointerEvent): boolean {
        let current: IMoveCursor;
        let element: Element;
        this.setMouseXY(e);
        const args: IMouseEventArgs = this.getMouseArgs(e, 'touchmove', gaugeMouseMove);
        this.trigger(gaugeMouseMove, args, (observedArgs: IMouseEventArgs) => {
            this.mouseX = args.x;
            this.mouseY = args.y;
            let dragArgs: IPointerDragEventArgs;
            let dragBlazorArgs: IPointerDragEventArgs;
            if (args.target && !args.cancel) {
                if ((args.target.id.indexOf('MarkerPointer') > -1) || (args.target.id.indexOf('BarPointer') > -1)) {
                    const pointerIndex: number = parseInt(args.target.id.slice(-1), 10);
                    const axisIndex: number = parseInt(args.target.id.match(/\d/g)[0], 10);
                    if (this.axes[axisIndex].pointers[pointerIndex].enableDrag) {
                        current = this.moveOnPointer(args.target as HTMLElement);
                        if (!(isNullOrUndefined(current)) && current.pointer) {
                            this.element.style.cursor = current.style;
                        }
                        if (this.activePointer) {
                            this.isDrag = true;
                            const dragPointInd: number = parseInt(this.activePointer.pathElement[0].id.slice(-1), 10);
                            const dragAxisInd: number = parseInt(this.activePointer.pathElement[0].id.match(/\d/g)[0], 10);
                            dragArgs = {
                                axis: this.activeAxis,
                                pointer: this.activePointer,
                                previousValue: this.activePointer.currentValue,
                                name: dragMove,
                                currentValue: null,
                                axisIndex: dragAxisInd,
                                pointerIndex: dragPointInd
                            };
                            dragBlazorArgs = {
                                previousValue: this.activePointer.currentValue,
                                name: dragMove,
                                currentValue: null,
                                pointerIndex: dragPointInd,
                                axisIndex: dragAxisInd
                            };
                            if (args.target.id.indexOf('MarkerPointer') > -1) {
                                this.markerDrag(this.activeAxis, (this.activeAxis.pointers[dragPointInd]) as Pointer);
                            } else {
                                this.barDrag(this.activeAxis, (this.activeAxis.pointers[dragPointInd]) as Pointer);
                            }
                            dragArgs.currentValue = dragBlazorArgs.currentValue = this.activePointer.currentValue;
                            this.trigger(dragMove, this.isBlazor ? dragBlazorArgs : dragArgs);
                        }
                    }
                } else {
                    this.element.style.cursor = (this.pointerDrag) ? this.element.style.cursor : 'auto';
                }
                this.gaugeOnMouseMove(e);
            }
        });
        this.notify(Browser.touchMoveEvent, e);
        return false;
    }

    /**
     * To find the mouse move on pointer.
     *
     * @param element
     */

    private moveOnPointer(element: HTMLElement): IMoveCursor {
        const clientRect: ClientRect = this.element.getBoundingClientRect();
        let isPointer: boolean = false;
        let top: number; let left: number;
        const pointerElement: Element = getElement(element.id);
        const svgPath: SVGPathElement = <SVGPathElement>pointerElement;
        let cursorStyle: string;
        let process: IMoveCursor;
        const current: IVisiblePointer = getPointer(element as HTMLElement, this);
        const axis: Axis = current.axis;
        const pointer: Pointer = current.pointer;
        if (pointer.enableDrag) {
            if (pointer.type === 'Bar') {
                if (this.orientation === 'Vertical') {
                    top = pointerElement.getBoundingClientRect().top - clientRect.top;
                    top = (!axis.isInversed) ? top : top + svgPath.getBBox().height;
                    isPointer = !axis.isInversed ? (this.mouseY < (top + 10) && this.mouseY >= top) :
                        (this.mouseY <= top && this.mouseY > (top - 10));
                    cursorStyle = 'grabbing';
                } else {
                    left = pointerElement.getBoundingClientRect().left - clientRect.left;
                    left = (!axis.isInversed) ? left + svgPath.getBBox().width : left;
                    isPointer = !axis.isInversed ? (this.mouseX > (left - 10) && this.mouseX <= left) :
                        (this.mouseX >= left && this.mouseX < (left + 10));
                    cursorStyle = 'grabbing';
                }
            } else {
                isPointer = true;
                cursorStyle = 'grabbing';
            }
        }
        if (isPointer) {
            process = { pointer: isPointer, style: cursorStyle };
        }
        return process;
    }

    /**
     * @private
     * Handle the right click
     * @param event
     */

    public gaugeRightClick(event: MouseEvent | PointerEvent): boolean {
        if (event.buttons === 2 || (<PointerEvent>event).pointerType === 'touch') {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
        return true;
    }


    /**
     * Handles the mouse leave.
     *
     * @return {boolean}
     * @private
     */
    public mouseLeave(e: PointerEvent): boolean {
        let parentNode: HTMLElement;
        this.activeAxis = null;
        this.activePointer = null;
        this.svgObject.setAttribute('cursor', 'auto');
        const args: IMouseEventArgs = this.getMouseArgs(e, 'touchmove', gaugeMouseLeave);
        if (!isNullOrUndefined(this.mouseElement)) {
            parentNode = <HTMLElement>this.element;
            parentNode.style.cursor = '';
            this.mouseElement = null;
            this.pointerDrag = false;
        }
        return false;
    }

    /**
     * Handles the mouse move on gauge.
     *
     * @return {boolean}
     * @private
     */
    public gaugeOnMouseMove(e: PointerEvent | TouchEvent): boolean {
        let current: IVisiblePointer;
        if (this.pointerDrag) {
            current = getPointer(this.mouseElement as HTMLElement, this);
            if (current.pointer.enableDrag && current.pointer.animationComplete) {
                this[current.pointer.type.toLowerCase() + 'Drag'](current.axis, current.pointer);
            }
        }
        return true;
    }

    /**
     * Handles the mouse up.
     *
     * @return {boolean}
     * @private
     */
    public mouseEnd(e: PointerEvent): boolean {
        this.setMouseXY(e);
        let parentNode: HTMLElement;
        let tooltipInterval: number;
        const isImage: boolean = isNullOrUndefined(this.activePointer) ? false : this.activePointer.markerType === 'Image';
        const isTouch: boolean = e.pointerType === 'touch' || e.pointerType === '2' || e.type === 'touchend';
        const args: IMouseEventArgs = this.getMouseArgs(e, 'touchend', gaugeMouseUp);
        const blazorArgs: IMouseEventArgs = {
            cancel: args.cancel, target: args.target, name: args.name, x: args.x, y: args.y
        };
        this.trigger(gaugeMouseUp, this.isBlazor ? blazorArgs : args);
        if (this.activeAxis && this.activePointer) {
            const pointerInd: number = parseInt(this.activePointer.pathElement[0].id.slice(-1), 10);
            const axisInd: number = parseInt(this.activePointer.pathElement[0].id.match(/\d/g)[0], 10);
            if (this.activePointer.enableDrag) {
                this.trigger(dragEnd, this.isBlazor ? {
                    name: dragEnd,
                    currentValue: this.activePointer.currentValue,
                    pointerIndex: pointerInd,
                    axisIndex: axisInd
                } as IPointerDragEventArgs : {
                    name: dragEnd,
                    axis: this.activeAxis,
                    pointer: this.activePointer,
                    currentValue: this.activePointer.currentValue,
                    axisIndex: axisInd,
                    pointerIndex: pointerInd
                } as IPointerDragEventArgs);
                if (isImage) {
                    this.activePointer.pathElement[0].setAttribute('cursor', 'pointer');
                }
                this.activeAxis = null;
                this.activePointer = null;
                this.isDrag = false;
                if (!isNullOrUndefined(this.mouseElement && !isImage)) {
                    this.triggerDragEvent(this.mouseElement);
                }
            }
        }
        if (!isNullOrUndefined(this.mouseElement)) {
            parentNode = <HTMLElement>this.element;
            parentNode.style.cursor = '';
            this.mouseElement = null;
            this.pointerDrag = false;
        }
        this.svgObject.setAttribute('cursor', 'auto');
        this.notify(Browser.touchEndEvent, e);
        return true;
    }

    /**
     * This method handles the print functionality for linear gauge.
     *
     * @param id - Specifies the element to print the linear gauge.
     */
    public print(id?: string[] | string | Element): void {
        if ((this.allowPrint) && (this.printModule)) {
            this.printModule.print(id);
        }
    }
    /**
     * This method handles the export functionality for linear gauge.
     *
     * @param type - Specifies the type of the export.
     * @param fileName - Specifies the file name for the exported file.
     * @param orientation - Specified the orientation for the exported pdf document.
     */
    public export(type: ExportType, fileName: string, orientation?: PdfPageOrientation, allowDownload?: boolean): Promise<string> {
        if (isNullOrUndefined(allowDownload)) {
            allowDownload = true;
        }
        if ((type !== 'PDF') && (this.allowImageExport) && (this.imageExportModule)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return new Promise((resolve: any, reject: any) => {
                resolve(this.imageExportModule.export(type, fileName, allowDownload));
            });
        } else if ((this.allowPdfExport) && (this.pdfExportModule)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return new Promise((resolve: any, reject: any) => {
                resolve(this.pdfExportModule.export(type, fileName, orientation, allowDownload));
            });
        }
        return null;
    }

    /**
     * Handles the mouse event arguments.
     *
     * @return {IMouseEventArgs}
     * @private
     */
    private getMouseArgs(e: PointerEvent, type: string, name: string): IMouseEventArgs {
        const rect: ClientRect = this.element.getBoundingClientRect();
        const location: GaugeLocation = new GaugeLocation(-rect.left, -rect.top);
        const isTouch: boolean = (e.type === type);
        location.x += isTouch ? (<TouchEvent & PointerEvent>e).changedTouches[0].clientX : e.clientX;
        location.y += isTouch ? (<TouchEvent & PointerEvent>e).changedTouches[0].clientY : e.clientY;
        return {
            cancel: false, name: name,
            model: !this.isBlazor ? this : null,
            x: location.x, y: location.y,
            target: isTouch ? <Element>(<TouchEvent & PointerEvent>e).target : <Element>e.target
        };
    }

    /**
     * @private
     * @param axis
     * @param pointer
     */

    public markerDrag(axis: Axis, pointer: Pointer): void {
        let options: PathOption;
        const value: number = convertPixelToValue(
            this.element, this.mouseElement, this.orientation, axis, 'drag', new GaugeLocation(this.mouseX, this.mouseY));
        const process: boolean = withInRange(value, null, null, axis.visibleRange.max, axis.visibleRange.min, 'pointer');
        if (withInRange(value, null, null, axis.visibleRange.max, axis.visibleRange.min, 'pointer')) {
            options = new PathOption(
                'pointerID', pointer.color || this.themeStyle.pointerColor,
                pointer.border.width, pointer.border.color, pointer.opacity, null, null, '');
            if (this.orientation === 'Vertical') {
                pointer.bounds.y = this.mouseY;
            } else {
                pointer.bounds.x = this.mouseX;
            }
            pointer.currentValue = value;
            options = calculateShapes(
                pointer.bounds, pointer.markerType, new Size(pointer.width, pointer.height),
                pointer.imageUrl, options, this.orientation, axis, pointer);
            if (pointer.markerType === 'Image') {
                this.mouseElement.setAttribute('x', (pointer.bounds.x - (pointer.bounds.width / 2)).toString());
                this.mouseElement.setAttribute('y', (pointer.bounds.y - (pointer.bounds.height / 2)).toString());
            } else if (pointer.markerType === 'Circle') {
                this.mouseElement.setAttribute('cx', (options.cx).toString());
                this.mouseElement.setAttribute('cy', (options.cy).toString());
                this.mouseElement.setAttribute('r',(options.r).toString());
            } else {
                this.mouseElement.setAttribute('d', options.d);
            }
        }
    }

    /**
     * @private
     * @param axis
     * @param pointer
     */

    public barDrag(axis: Axis, pointer: Pointer): void {
        const line: Rect = axis.lineBounds;
        const range: VisibleRange = axis.visibleRange;
        let isDrag: boolean;
        const lineHeight: number = (this.orientation === 'Vertical') ? line.height : line.width;
        const lineY: number = (this.orientation === 'Vertical') ? line.y : line.x;
        let path: string;
        const value1: number = ((valueToCoefficient(range.min, axis, this.orientation, range) * lineHeight) + lineY);
        const value2: number = ((valueToCoefficient(range.max, axis, this.orientation, range) * lineHeight) + lineY);
        if (this.orientation === 'Vertical') {
            isDrag = (!axis.isInversed) ? (this.mouseY > value2 && this.mouseY < value1) : (this.mouseY > value1 && this.mouseY < value2);
            if (isDrag) {
                if (this.container.type === 'Normal') {
                    if (!axis.isInversed) {
                        this.mouseElement.setAttribute('y', this.mouseY.toString());
                    }
                    this.mouseElement.setAttribute('height', Math.abs(value1 - this.mouseY).toString());
                } else {
                    if (!axis.isInversed) {
                        pointer.bounds.y = this.mouseY;
                    }
                    pointer.bounds.height = Math.abs(value1 - this.mouseY);
                }
            }
        } else {
            isDrag = (!axis.isInversed) ? (this.mouseX > value1 && this.mouseX < value2) : (this.mouseX > value2 && this.mouseX < value1);
            if (isDrag) {
                if (this.container.type === 'Normal') {
                    if (axis.isInversed) {
                        this.mouseElement.setAttribute('x', this.mouseX.toString());
                    }
                    this.mouseElement.setAttribute('width', Math.abs(value1 - this.mouseX).toString());
                } else {
                    if (axis.isInversed) {
                        pointer.bounds.x = this.mouseX;
                    }
                    pointer.bounds.width = Math.abs(value1 - this.mouseX);
                }
            }
        }
        if (isDrag && this.mouseElement.tagName === 'path') {
            path = getBox(
                pointer.bounds, this.container.type, this.orientation,
                new Size(pointer.bounds.width, pointer.bounds.height), 'bar', this.container.width, axis, pointer.roundedCornerRadius);
            this.mouseElement.setAttribute('d', path);
        }
    }

    /**
     * Triggers when drag the pointer
     *
     * @param activeElement
     */

    private triggerDragEvent(activeElement: Element): void {
        const active: IVisiblePointer = getPointer(activeElement as HTMLElement, this);
        const value: number = convertPixelToValue(
            this.element, activeElement, this.orientation, active.axis, 'tooltip', null);
        let dragArgs: IValueChangeEventArgs = {
            name: 'valueChange',
            gauge: !this.isBlazor ? this : null,
            element: activeElement,
            axisIndex: active.axisIndex,
            axis: !this.isBlazor ? active.axis : null,
            pointerIndex: active.pointerIndex,
            pointer: !this.isBlazor ? active.pointer : null,
            value: value
        };
        if (this.isBlazor) {
            const { gauge, axis, pointer, ...blazorArgsData } : IValueChangeEventArgs = dragArgs;
            dragArgs = blazorArgsData;
        }
        this.trigger(valueChange, dragArgs, (pointerArgs : IValueChangeEventArgs) => {
            this.setPointerValue(pointerArgs.axisIndex, pointerArgs.pointerIndex, pointerArgs.value);
        });
    }

    /**
     * This method is used to set the pointer value in the linear gauge.
     *
     * @param axisIndex - Specifies the index of the axis.
     * @param pointerIndex - Specifies the index of the pointer.
     * @param value - Specifies the pointer value.
     */

    public setPointerValue(axisIndex: number, pointerIndex: number, value: number): void {
        const axis: Axis = <Axis>this.axes[axisIndex];
        const pointer: Pointer = <Pointer>axis.pointers[pointerIndex];
        const id: string = this.element.id + '_AxisIndex_' + axisIndex + '_' + pointer.type + 'Pointer_' + pointerIndex;
        const pointerElement: Element = getElement(id);
        pointer.currentValue = value;
        if (
            (pointerElement !== null) && withInRange(
                pointer.currentValue, null, null, axis.visibleRange.max, axis.visibleRange.min, 'pointer'
            )
        ) {
            this.gaugeAxisLayoutPanel['calculate' + pointer.type + 'Bounds'](axisIndex, axis, pointerIndex, pointer);
            this.axisRenderer['draw' + pointer.type + 'Pointer'](axis, axisIndex, pointer, pointerIndex, pointerElement.parentElement);
        }
    }

    /**
     * This method is used to set the annotation value in the linear gauge.
     *
     * @param annotationIndex - Specifies the index of the annotation.
     * @param content - Specifies the text of the annotation.
     */

    public setAnnotationValue(annotationIndex: number, content: string, axisValue?: number): void {
        const elementExist: boolean = getElement(this.element.id + '_Annotation_' + annotationIndex) === null;
        const element: HTMLElement = <HTMLElement>getElement(this.element.id + '_AnnotationsGroup') ||
            createElement('div', {
                id: this.element.id + '_AnnotationsGroup'
            });
        const annotation: Annotation = <Annotation>this.annotations[annotationIndex];
        if (content !== null) {
            removeElement(this.element.id + '_Annotation_' + annotationIndex);
            annotation.content = content;
            annotation.axisValue = axisValue ? axisValue : annotation.axisValue;
            this.annotationsModule.createAnnotationTemplate(element, annotationIndex);
            if (!elementExist) {
                element.appendChild(getElement(this.element.id + '_Annotation_' + annotationIndex));
            }
        }
    }

    /**
     * To provide the array of modules needed for control rendering
     *
     * @return {ModuleDeclaration[]}
     * @private
     */
    public requiredModules(): ModuleDeclaration[] {
        const modules: ModuleDeclaration[] = [];
        let annotationEnable: boolean = false;
        const tooltipEnable: boolean = false;
        this.annotations.map((annotation: Annotation, index: number) => {
            annotationEnable = annotation.content != null;
        });
        if (annotationEnable) {
            modules.push({
                member: 'Annotations',
                args: [this, Annotations]
            });
        }
        if (this.tooltip.enable) {
            modules.push({
                member: 'Tooltip',
                args: [this, GaugeTooltip]
            });
        }
        if (this.allowPrint) {
            modules.push({
                member: 'Print',
                args: [this]
            });
        }
        if (this.allowImageExport) {
            modules.push({
                member: 'ImageExport',
                args: [this]
            });
        }
        if (this.allowPdfExport) {
            modules.push({
                member: 'PdfExport',
                args: [this]
            });
        }
        modules.push({
            member: 'Gradient',
            args: [this, Gradient]
        });
        return modules;
    }

    /**
     * Get the properties to be maintained in the persisted state.
     *
     * @private
     */
    public getPersistData(): string {
        const keyEntity: string[] = ['loaded'];
        return this.addOnPersist(keyEntity);
    }

    /**
     * Get component name
     */
    public getModuleName(): string {
        return 'lineargauge';
    }

    /**
     * Called internally if any of the property value changed.
     *
     * @private
     */
    public onPropertyChanged(newProp: LinearGaugeModel, oldProp: LinearGaugeModel): void {
        let renderer: boolean = false;
        let refreshBounds: boolean = false;
        for (const prop of Object.keys(newProp)) {
            switch (prop) {
            case 'height':
            case 'width':
            case 'margin':
                this.createSvg();
                refreshBounds = true;
                break;
            case 'title':
                refreshBounds = (newProp.title === '' || oldProp.title === '');
                renderer = !(newProp.title === '' || oldProp.title === '');
                break;
            case 'titleStyle':
                if (newProp.titleStyle && newProp.titleStyle.size) {
                    refreshBounds = true;
                } else {
                    renderer = true;
                }
                break;
            case 'border':
                renderer = true;
                break;
            case 'background':
                renderer = true;
                break;
            case 'container':
            case 'axes':
            case 'orientation':
                refreshBounds = true;
                break;
            }
        }
        if (!refreshBounds && renderer) {
            this.removeSvg();
            this.renderGaugeElements();
            this.renderAxisElements();
        }
        if (refreshBounds) {
            this.createSvg();
            this.renderGaugeElements();
            this.calculateBounds();
            this.renderAxisElements();
        }
    }
}
