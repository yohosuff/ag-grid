import { CartesianChart } from "../cartesianChart";
import { Path } from "../../scene/shape/path";
import ContinuousScale from "../../scale/continuousScale";
import { Selection } from "../../scene/selection";
import { Group } from "../../scene/group";
import palette from "../palettes";
import { Series, SeriesNodeDatum } from "./series";
import { numericExtent } from "../../util/array";
import { Color } from "../../util/color";
import { toFixed } from "../../util/number";
import { PointerEvents } from "../../scene/node";
import { LegendDatum } from "../legend";
import { Shape } from "../../scene/shape/shape";
import { LineTooltipRendererParams } from "../../chartOptions";
import { Marker } from "../marker/marker";

interface GroupSelectionDatum extends SeriesNodeDatum {
    x: number;
    y: number;
    fill?: string;
    stroke?: string;
    strokeWidth: number;
    size: number;
}

export class LineSeries extends Series<CartesianChart> {

    static className = 'LineSeries';

    private domainX: any[] = [];
    private domainY: any[] = [];
    private xData: any[] = [];
    private yData: any[] = [];

    private lineNode = new Path();

    private groupSelection: Selection<Group, Group, any, any> = Selection.select(this.group).selectAll<Group>();

    constructor() {
        super();

        const lineNode = this.lineNode;
        lineNode.fill = undefined;
        lineNode.lineJoin = 'round';
        lineNode.pointerEvents = PointerEvents.None;
        this.group.append(lineNode);

        this.marker.onChange = this.update.bind(this);
        this.marker.onTypeChange = this.onMarkerTypeChange.bind(this);
    }

    onMarkerTypeChange() {
        this.groupSelection = this.groupSelection.setData([]);
        this.groupSelection.exit.remove();
        this.update();
    }

    set chart(chart: CartesianChart | undefined) {
        if (this._chart !== chart) {
            this._chart = chart;
            this.scheduleData();
        }
    }
    get chart(): CartesianChart | undefined {
        return this._chart;
    }

    protected _title?: string;
    set title(value: string | undefined) {
        if (this._title !== value) {
            this._title = value;
            this.scheduleLayout();
        }
    }
    get title(): string | undefined {
        return this._title;
    }

    protected _xField: string = '';
    set xField(value: string) {
        if (this._xField !== value) {
            this._xField = value;
            this.xData = [];
            this.scheduleData();
        }
    }
    get xField(): string {
        return this._xField;
    }

    protected _xFieldName: string = '';
    set xFieldName(value: string) {
        if (this._xFieldName !== value) {
            this._xFieldName = value;
            this.update();
        }
    }
    get xFieldName(): string {
        return this._xFieldName;
    }

    protected _yField: string = '';
    set yField(value: string) {
        if (this._yField !== value) {
            this._yField = value;
            this.yData = [];
            this.scheduleData();
        }
    }
    get yField(): string {
        return this._yField;
    }

    protected _yFieldName: string = '';
    set yFieldName(value: string) {
        if (this._yFieldName !== value) {
            this._yFieldName = value;
            this.update();
        }
    }
    get yFieldName(): string {
        return this._xFieldName;
    }

    processData(): boolean {
        const { chart, xField, yField } = this;

        if (!(chart && chart.xAxis && chart.yAxis)) {
            return false;
        }

        if (!(xField && yField)) {
            this._data = [];
        }

        this.xData = this.data.map(datum => datum[xField]);
        this.yData = this.data.map(datum => datum[yField]);

        const isContinuousX = chart.xAxis.scale instanceof ContinuousScale;
        const domainX = isContinuousX ? (numericExtent(this.xData) || [0, 1]) : this.xData;
        const domainY = numericExtent(this.yData) || [0, 1];

        if (isContinuousX) {
            const [min, max] = domainX as number[];

            if (min === max) {
                domainX[0] = min - 1;
                domainX[1] = max + 1;
            }
        }

        const [min, max] = domainY;

        if (min === max) {
            domainY[0] = min - 1;
            domainY[1] = max + 1;
        }

        this.domainX = domainX;
        this.domainY = domainY;

        return true;
    }

    private _fill: string = palette.fills[0];
    set fill(value: string) {
        if (this._fill !== value) {
            this._fill = value;
            this.stroke = Color.fromString(value).darker().toHexString();
            this.scheduleData();
        }
    }
    get fill(): string {
        return this._fill;
    }

    private _stroke: string = palette.strokes[0];
    set stroke(value: string) {
        if (this._stroke !== value) {
            this._stroke = value;
            this.scheduleData();
        }
    }
    get stroke(): string {
        return this._stroke;
    }

    private _strokeWidth: number = 3;
    set strokeWidth(value: number) {
        if (this._strokeWidth !== value) {
            this._strokeWidth = value;
            this.update();
        }
    }
    get strokeWidth(): number {
        return this._strokeWidth;
    }

    highlightStyle: {
        fill?: string,
        stroke?: string
    } = {
            fill: 'yellow'
        };

    private highlightedNode?: Marker;

    highlightNode(node: Shape) {
        if (!(node instanceof Marker)) {
            return;
        }

        this.highlightedNode = node;
        this.scheduleLayout();
    }

    dehighlightNode() {
        this.highlightedNode = undefined;
        this.scheduleLayout();
    }

    update(): void {
        const chart = this.chart;
        const visible = this.group.visible = this.visible;

        if (!chart || !visible || chart.dataPending || chart.layoutPending || !(chart.xAxis && chart.yAxis)) {
            return;
        }

        const { xAxis: { scale: xScale }, yAxis: { scale: yScale } } = chart;
        const xOffset = (xScale.bandwidth || 0) / 2;
        const yOffset = (yScale.bandwidth || 0) / 2;

        const {
            data,
            xData,
            yData,
            fill,
            stroke,
            marker,
            lineNode
        } = this;

        const linePath = lineNode.path;
        const Marker = marker.type;
        const markerSize = marker.size;
        const markerStrokeWidth = marker.strokeWidth;

        linePath.clear();

        const groupSelectionData: GroupSelectionDatum[] = [];

        xData.forEach((xDatum, i) => {
            const yDatum = yData[i];
            const x = xScale.convert(xDatum) + xOffset;
            const y = yScale.convert(yDatum) + yOffset;

            if (i > 0) {
                linePath.lineTo(x, y);
            } else {
                linePath.moveTo(x, y);
            }

            if (marker) {
                groupSelectionData.push({
                    seriesDatum: data[i],
                    x,
                    y,
                    fill,
                    stroke,
                    strokeWidth: markerStrokeWidth,
                    size: markerSize / 2
                });
            }
        });

        lineNode.stroke = fill; // use fill colour for the line
        lineNode.strokeWidth = this.strokeWidth;

        const updateGroups = this.groupSelection.setData(groupSelectionData);
        updateGroups.exit.remove();

        const enterGroups = updateGroups.enter.append(Group);
        enterGroups.append(Marker);

        const highlightedNode = this.highlightedNode;
        const groupSelection = updateGroups.merge(enterGroups);
        const { fill: highlightFill, stroke: highlightStroke } = this.highlightStyle;

        groupSelection.selectByClass(Marker)
            .each((node, datum) => {
                node.translationX = datum.x;
                node.translationY = datum.y;
                node.size = datum.size;
                node.fill = node === highlightedNode && highlightFill !== undefined ? highlightFill : marker.fill || datum.fill;
                node.stroke = node === highlightedNode && highlightStroke !== undefined ? highlightStroke : marker.stroke || datum.stroke;
                node.fillOpacity = marker.fillOpacity;
                node.strokeOpacity = marker.strokeOpacity;
                node.strokeWidth = datum.strokeWidth;
                node.visible = marker.enabled && datum.size > 0;
            });

        this.groupSelection = groupSelection;
    }

    getDomainX(): any[] {
        return this.domainX;
    }

    getDomainY(): any[] {
        return this.domainY;
    }

    getTooltipHtml(nodeDatum: GroupSelectionDatum): string {
        const { xField: xKey, yField: yKey } = this;

        if (!xKey || !yKey) {
            return "";
        }

        const { xFieldName: xName, yFieldName: yName, fill: color, title, tooltipRenderer } = this;

        if (tooltipRenderer) {
            return tooltipRenderer({
                datum: nodeDatum.seriesDatum,
                xKey,
                xName,
                yKey,
                yName,
                title,
                color,
            });
        } else {
            const titleStyle = `style="color: white; background-color: ${color}"`;
            const titleString = title ? `<div class="title" ${titleStyle}>${title}</div>` : '';
            const seriesDatum = nodeDatum.seriesDatum;
            const xValue = seriesDatum[xKey];
            const yValue = seriesDatum[yKey];
            const xString = typeof xValue === 'number' ? toFixed(xValue) : String(xValue);
            const yString = typeof yValue === 'number' ? toFixed(yValue) : String(yValue);

            return `${titleString}<div class="content">${xString}: ${yString}</div>`;
        }
    }

    tooltipRenderer?: (params: LineTooltipRendererParams) => string;

    listSeriesItems(data: LegendDatum[]): void {
        if (this.data.length && this.xField && this.yField) {
            data.push({
                id: this.id,
                itemId: undefined,
                enabled: this.visible,
                label: {
                    text: this.title || this.yField
                },
                marker: {
                    fill: this.fill,
                    stroke: this.stroke
                }
            });
        }
    }
}
